-- Y2 orchestration schema: backup recovery pilot, reconciliation v2, orchestration reschedule

-- AlterEnum BackupShiftRecoveryStatus
ALTER TYPE "BackupShiftRecoveryStatus" ADD VALUE IF NOT EXISTS 'awaiting_dispatch';
ALTER TYPE "BackupShiftRecoveryStatus" ADD VALUE IF NOT EXISTS 'closed';

ALTER TYPE "OrchestrationEventType" ADD VALUE IF NOT EXISTS 'care_transport_cancel_propagated';

-- CreateEnum BackupShiftRecoveryMisfitSeverity
CREATE TYPE "BackupShiftRecoveryMisfitSeverity" AS ENUM ('none', 'minor', 'serious');

-- AlterTable backup_shift_recoveries
ALTER TABLE "backup_shift_recoveries" ADD COLUMN IF NOT EXISTS "misfitSeverity" "BackupShiftRecoveryMisfitSeverity" NOT NULL DEFAULT 'none';
ALTER TABLE "backup_shift_recoveries" ADD COLUMN IF NOT EXISTS "misfitNotes" TEXT;
ALTER TABLE "backup_shift_recoveries" ADD COLUMN IF NOT EXISTS "misfitReportedAt" TIMESTAMP(3);
ALTER TABLE "backup_shift_recoveries" ADD COLUMN IF NOT EXISTS "autoDetected" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "backup_shift_recoveries_status_createdAt_idx" ON "backup_shift_recoveries"("status", "createdAt");

-- CreateEnum ReconciliationExceptionWorkflowState
CREATE TYPE "ReconciliationExceptionWorkflowState" AS ENUM ('open', 'investigating', 'resolved', 'written_off');

-- AlterTable payment reconciliation
ALTER TABLE "PaymentReconciliationBatch" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "PaymentReconciliationBatch" ADD COLUMN IF NOT EXISTS "summaryJson" JSONB;

ALTER TABLE "PaymentReconciliationException" ADD COLUMN IF NOT EXISTS "workflowState" "ReconciliationExceptionWorkflowState" NOT NULL DEFAULT 'open';
ALTER TABLE "PaymentReconciliationException" ADD COLUMN IF NOT EXISTS "assigneeId" TEXT;
ALTER TABLE "PaymentReconciliationException" ADD COLUMN IF NOT EXISTS "reasonCode" TEXT;
ALTER TABLE "PaymentReconciliationException" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
ALTER TABLE "PaymentReconciliationException" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "PaymentReconciliationBatch_organisationId_idx" ON "PaymentReconciliationBatch"("organisationId");

-- CreateTable orchestration_reschedule_requests
CREATE TABLE IF NOT EXISTS "orchestration_reschedule_requests" (
    "id" TEXT NOT NULL,
    "careRequestId" TEXT,
    "careShiftId" TEXT,
    "transportBookingId" TEXT,
    "requestedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orchestration_reschedule_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "orchestration_reschedule_requests_requestedById_status_idx" ON "orchestration_reschedule_requests"("requestedById", "status");
