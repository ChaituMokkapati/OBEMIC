-- Clear existing batches to safely add NOT NULL expiresAt and drop enum values
DELETE FROM "ImportBatch";

-- AlterEnum
BEGIN;
CREATE TYPE "ImportStatus_new" AS ENUM ('PREVIEWED', 'CONFIRMING', 'CONFIRMED', 'FAILED', 'EXPIRED', 'STALE');
ALTER TABLE "ImportBatch" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ImportBatch" ALTER COLUMN "status" TYPE "ImportStatus_new" USING (CASE WHEN "status"::text = 'PREVIEW' THEN 'PREVIEWED' ELSE "status"::text END)::"ImportStatus_new";
ALTER TYPE "ImportStatus" RENAME TO "ImportStatus_old";
ALTER TYPE "ImportStatus_new" RENAME TO "ImportStatus";
DROP TYPE "ImportStatus_old";
ALTER TABLE "ImportBatch" ALTER COLUMN "status" SET DEFAULT 'PREVIEWED';
COMMIT;

-- AlterTable
ALTER TABLE "ImportBatch" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PREVIEWED';
