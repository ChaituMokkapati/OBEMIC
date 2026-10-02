import { FacultyWorkbookReader } from './FacultyWorkbookReader';
import { FacultyImportValidator, FacultyImportPayload } from './FacultyImportValidator';
import prisma from '../../../../database';
import { ImportStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ImportLifecycleService } from '../ImportLifecycleService';

export class BatchNotFoundError extends Error {}
export class BatchAlreadyConfirmedError extends Error {}
export class BatchExpiredError extends Error {}
export class BatchInvalidStateError extends Error {}
export class StaleDataError extends Error {}

export interface ConfirmOptions {
  injectFailure?: boolean; // For transaction rollback tests
}

export class FacultyImportService {
  private reader = new FacultyWorkbookReader();
  private validator = new FacultyImportValidator();
  private lifecycle = new ImportLifecycleService();

  public async preview(filePath: string, adminUserId: string) {
    const rawRecords = await this.reader.parse(filePath);
    const payload = await this.validator.validate(rawRecords);

    // 30 minutes expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    const batch = await prisma.importBatch.create({
      data: {
        importType: 'FACULTY_IMPORT',
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
        // 1. Pessimistic Lock on ImportBatch to serialize concurrent requests
        const batchList = await tx.$queryRaw<any[]>`SELECT * FROM "ImportBatch" WHERE id = ${batchId} FOR UPDATE NOWAIT`;
        
        if (batchList.length === 0) throw new BatchNotFoundError();
        const batch = batchList[0];
        
        if (batch.status === ImportStatus.CONFIRMED) throw new BatchAlreadyConfirmedError();
        if (batch.status === ImportStatus.EXPIRED) throw new BatchExpiredError();
        if (batch.status !== ImportStatus.PREVIEWED) throw new BatchInvalidStateError();
        if (new Date() >= batch.expiresAt) throw new BatchExpiredError(); // Implicit expiry

        // 3. Mark CONFIRMING immediately within this transaction scope
        await tx.importBatch.update({ 
          where: { id: batchId }, 
          data: { status: ImportStatus.CONFIRMING } 
        });

        const payload: FacultyImportPayload = JSON.parse(batch.details || '{}');
        
        // 4. Revalidate DB state
        const isStale = await this.validateAgainstDb(tx, payload);
        if (isStale) {
          throw new StaleDataError('Database state has changed since preview.');
        }

        // 5. Business Persistence
        const role = await tx.role.findUnique({ where: { roleName: 'FACULTY' } });
        if (!role) throw new Error('FACULTY role not found in database');

        let processed = 0;
        for (const record of payload.validRecords) {
          if (record.action === 'CREATE') {
             // Generate temporary password
             const tempPassword = `${record.employeeId}@${record.canonicalDepartmentCode}`;
             const passwordHash = await bcrypt.hash(tempPassword, 10);

             // Create User
             const user = await tx.user.create({
               data: {
                 employeeId: record.employeeId,
                 name: record.facultyName,
                 email: `${record.employeeId}@obemic.local`,
                 passwordHash,
                 mustChangePassword: true,
                 departmentId: record.departmentId!,
                 roleId: role.id
               }
             });

             // Create Faculty Profile
             await tx.facultyProfile.create({
               data: {
                 userId: user.id
               }
             });

             processed++;
             
             if (options?.injectFailure) {
                throw new Error('Injected failure during business write');
             }
          }
          // Note: UNCHANGED records are skipped, and conflicts (if somehow in validRecords) are ignored.
        }

        // 6. Audit Log
        await tx.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'CONFIRM_FACULTY_IMPORT',
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
      }, { maxWait: 10000, timeout: 60000 });
    } catch (error) {
       // Safe follow-up logging outside the rolled-back transaction
       if (error instanceof StaleDataError) {
          await this.lifecycle.safelyMarkTerminal(batchId, ImportStatus.STALE);
       } else if (error instanceof BatchExpiredError) {
          await this.lifecycle.safelyMarkTerminal(batchId, ImportStatus.EXPIRED);
       } else if (error instanceof BatchNotFoundError || error instanceof BatchAlreadyConfirmedError || error instanceof BatchInvalidStateError) {
          // Do nothing, state is already immutable or locked by another process
       } else {
          await this.lifecycle.safelyMarkTerminal(batchId, ImportStatus.FAILED);
       }
       throw error;
    }
  }

  private async validateAgainstDb(tx: any, payload: FacultyImportPayload): Promise<boolean> {
     // Re-check each record
     for (const record of payload.validRecords) {
        const existing = await tx.user.findUnique({ where: { employeeId: record.employeeId } });
        if (record.action === 'CREATE') {
           // Should still be new
           if (existing) return true;
        } else if (record.action === 'UNCHANGED') {
           // Should still exist, name should match, dept should match
           if (!existing) return true;
           if (existing.name.toUpperCase() !== record.facultyName.toUpperCase()) return true;
           if (existing.departmentId !== record.departmentId) return true;
        }
     }
     return false;
  }
}
