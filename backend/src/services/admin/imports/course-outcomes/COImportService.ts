import { COWorkbookReader } from './COWorkbookReader';
import { COImportValidator, COImportPayload } from './COImportValidator';
import prisma from '../../../../database';
import { ImportStatus } from '@prisma/client';
import { ImportLifecycleService } from '../ImportLifecycleService';

export class BatchNotFoundError extends Error {}
export class BatchAlreadyConfirmedError extends Error {}
export class BatchExpiredError extends Error {}
export class BatchInvalidStateError extends Error {}
export class StaleDataError extends Error {}

export interface ConfirmOptions {
  injectFailure?: boolean; // For transaction rollback tests
}

export class COImportService {
  private reader = new COWorkbookReader();
  private validator = new COImportValidator();
  private lifecycle = new ImportLifecycleService();

  public async preview(filePath: string, adminUserId: string) {
    const rawBlocks = await this.reader.parse(filePath);
    const payload = await this.validator.validate(rawBlocks);

    // 30 minutes expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    const batch = await prisma.importBatch.create({
      data: {
        importType: 'CO_IMPORT',
        status: ImportStatus.PREVIEWED,
        importedBy: adminUserId,
        details: JSON.stringify(payload),
        expiresAt
      }
    });

    return {
      batchId: batch.id,
      ...payload,
      expiresAt
    };
  }

  public async confirm(batchId: string, adminUserId: string, options?: ConfirmOptions) {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Pessimistic Lock on ImportBatch
        const batchList = await tx.$queryRaw<any[]>`SELECT * FROM "ImportBatch" WHERE id = ${batchId} FOR UPDATE NOWAIT`;
        
        if (batchList.length === 0) throw new BatchNotFoundError();
        const batch = batchList[0];
        
        if (batch.status === ImportStatus.CONFIRMED) throw new BatchAlreadyConfirmedError();
        if (batch.status === ImportStatus.EXPIRED) throw new BatchExpiredError();
        if (batch.status !== ImportStatus.PREVIEWED) throw new BatchInvalidStateError();
        if (new Date() >= batch.expiresAt) throw new BatchExpiredError();

        // 3. Mark CONFIRMING
        await tx.importBatch.update({ 
          where: { id: batchId }, 
          data: { status: ImportStatus.CONFIRMING } 
        });

        const payload: COImportPayload = JSON.parse(batch.details || '{}');
        
        // 4. Revalidate DB state
        const isStale = await this.validateAgainstDb(tx, payload);
        if (isStale) {
          throw new StaleDataError('Database state has changed since preview.');
        }

        // 5. Business Persistence
        let processed = 0;
        for (const block of payload.validBlocks) {
          if (block.action === 'CREATE') {
            await tx.subject.create({
              data: {
                subjectCode: block.normalizedSubjectCode,
                subjectName: block.subjectName,
                departmentId: block.departmentId!,
                regulationId: block.regulationId || null,
                semesterLevel: block.semesterLevel || null,
                courseOutcomes: {
                  create: block.courseOutcomes.filter(co => co.action === 'CREATE').map(co => ({
                    coCode: co.coCode,
                    description: co.description,
                    copoMappings: co.poMatrix ? {
                      create: Object.entries(co.poMatrix).map(([poCode, correlationLevel]) => ({
                        poCode,
                        correlationLevel: Number(correlationLevel)
                      }))
                    } : undefined
                  }))
                }
              }
            });
            processed++;
            if (options?.injectFailure) throw new Error('Injected failure during Subject creation');
          } else if (block.action === 'UNCHANGED') {
            // Subject exists, just add new COs
            const newCos = block.courseOutcomes.filter(co => co.action === 'CREATE');
            if (newCos.length > 0) {
               const existingSubj = await tx.subject.findUnique({ where: { subjectCode: block.normalizedSubjectCode } });
               if (existingSubj) {
                  for (const co of newCos) {
                     await tx.courseOutcome.create({
                        data: {
                           coCode: co.coCode,
                           description: co.description,
                           subjectId: existingSubj.id,
                           copoMappings: co.poMatrix ? {
                             create: Object.entries(co.poMatrix).map(([poCode, correlationLevel]) => ({
                               poCode,
                               correlationLevel: Number(correlationLevel)
                             }))
                           } : undefined
                        }
                     });
                     processed++;
                     if (options?.injectFailure) throw new Error('Injected failure during CO creation');
                  }
               }
            }
          }
        }

        // 6. Audit Log
        await tx.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'CONFIRM_CO_IMPORT',
            entity: 'ImportBatch',
            entityId: batchId
          }
        });
        
        // 7. Final State
        await tx.importBatch.update({ 
          where: { id: batchId }, 
          data: { status: ImportStatus.CONFIRMED } 
        });

        return { success: true, processed };
      }, { timeout: 30000 });
    } catch (error) {
       if (error instanceof StaleDataError) {
          await this.lifecycle.safelyMarkTerminal(batchId, ImportStatus.STALE);
       } else if (error instanceof BatchExpiredError) {
          await this.lifecycle.safelyMarkTerminal(batchId, ImportStatus.EXPIRED);
       } else if (error instanceof BatchNotFoundError || error instanceof BatchAlreadyConfirmedError || error instanceof BatchInvalidStateError) {
          // Do nothing
       } else {
          await this.lifecycle.safelyMarkTerminal(batchId, ImportStatus.FAILED);
       }
       throw error;
    }
  }

  private async validateAgainstDb(tx: any, payload: COImportPayload): Promise<boolean> {
     for (const block of payload.validBlocks) {
        const existingSubject = await tx.subject.findUnique({ 
          where: { subjectCode: block.normalizedSubjectCode },
          include: { courseOutcomes: true }
        });

        if (block.action === 'CREATE') {
           if (existingSubject) return true; // Suddenly created by someone else
        } else if (block.action === 'UNCHANGED') {
           if (!existingSubject) return true; // Suddenly deleted
           if (existingSubject.subjectName.toUpperCase() !== block.subjectName.toUpperCase()) return true;
           if (existingSubject.departmentId !== block.departmentId ||
               existingSubject.regulationId !== block.regulationId ||
               existingSubject.semesterLevel !== block.semesterLevel) return true;

           // Check COs
           for (const co of block.courseOutcomes) {
              const exCo = existingSubject.courseOutcomes.find((c: any) => c.coCode === co.coCode);
              if (co.action === 'CREATE') {
                 if (exCo) return true; // Suddenly added
              } else if (co.action === 'UNCHANGED') {
                 if (!exCo) return true; // Suddenly deleted
                 if (exCo.description !== co.description) return true;
              }
           }
        }
     }
     return false;
  }
}
