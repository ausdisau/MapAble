-- Y1 wedge: support profile, incident intake v2, backup shift recovery, micro-consent scope

-- CreateEnum
CREATE TYPE "IncidentIntakePath" AS ENUM ('concern', 'incident', 'safeguarding');

-- CreateEnum
CREATE TYPE "BackupShiftRecoveryStatus" AS ENUM ('detected', 'proposing', 'awaiting_participant', 'assigned', 'failed', 'escalated');

-- AlterEnum
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'support_profile_read';

-- CreateTable
CREATE TABLE "support_profiles" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "routinesJson" JSONB NOT NULL DEFAULT '[]',
    "preferencesJson" JSONB NOT NULL DEFAULT '[]',
    "boundariesJson" JSONB NOT NULL DEFAULT '[]',
    "escalationJson" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_shift_recoveries" (
    "id" TEXT NOT NULL,
    "careShiftId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "BackupShiftRecoveryStatus" NOT NULL DEFAULT 'detected',
    "matchRunId" TEXT,
    "selectedCandidateId" TEXT,
    "excludedWorkerId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backup_shift_recoveries_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "IncidentReport" ADD COLUMN "intakePath" "IncidentIntakePath",
ADD COLUMN "intakeMetadataJson" JSONB,
ADD COLUMN "participantIntent" TEXT;

-- AlterTable
ALTER TABLE "care_service_recovery_links" ADD COLUMN "careShiftId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "support_profiles_participantId_key" ON "support_profiles"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "backup_shift_recoveries_careShiftId_key" ON "backup_shift_recoveries"("careShiftId");

-- CreateIndex
CREATE INDEX "backup_shift_recoveries_participantId_status_idx" ON "backup_shift_recoveries"("participantId", "status");

-- CreateIndex
CREATE INDEX "care_service_recovery_links_careShiftId_idx" ON "care_service_recovery_links"("careShiftId");

-- AddForeignKey
ALTER TABLE "support_profiles" ADD CONSTRAINT "support_profiles_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_shift_recoveries" ADD CONSTRAINT "backup_shift_recoveries_careShiftId_fkey" FOREIGN KEY ("careShiftId") REFERENCES "CareShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
