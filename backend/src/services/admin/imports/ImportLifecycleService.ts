import prisma from '../../../database';
import { ImportStatus } from '@prisma/client';

export class ImportLifecycleService {
  /**
   * Safely transitions a batch to a terminal state (FAILED, EXPIRED, STALE)
   * if it is currently eligible to be transitioned.
   * Uses a separate transaction to ensure failure logging succeeds even if main transaction rolls back.
   */
  public async safelyMarkTerminal(batchId: string, status: ImportStatus): Promise<void> {
    if (status !== ImportStatus.FAILED && status !== ImportStatus.EXPIRED && status !== ImportStatus.STALE) {
      throw new Error(`Cannot safelyMarkTerminal to non-terminal status: ${status}`);
    }

    try {
      await prisma.$transaction(async (tx) => {
        const batchList = await tx.$queryRaw<any[]>`SELECT status FROM "ImportBatch" WHERE id = ${batchId} FOR UPDATE NOWAIT`;
        if (batchList.length === 0) return; // Batch gone

        const currentStatus = batchList[0].status;

        // A confirmed batch is immutable
        if (currentStatus === ImportStatus.CONFIRMED) return;
        
        // Already in target terminal state
        if (currentStatus === status) return;

        // If it's already failed/expired/stale, we might overwrite it or leave it. 
        // For now, we allow moving from CONFIRMING or PREVIEWED to terminal.
        if (currentStatus === ImportStatus.PREVIEWED || currentStatus === ImportStatus.CONFIRMING) {
           await tx.importBatch.update({
             where: { id: batchId },
             data: { status }
           });
        }
      });
    } catch (e) {
      // If locking fails here, it might mean another process is dealing with it.
      // We gracefully swallow it as it's a fallback mechanism.
    }
  }
}
