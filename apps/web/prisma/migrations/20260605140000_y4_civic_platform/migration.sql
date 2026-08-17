-- Y4 civic platform schema extensions

-- AlterEnum
ALTER TYPE "DataVaultRequestStatus" ADD VALUE IF NOT EXISTS 'approved' BEFORE 'processing';

-- AlterEnum
ALTER TYPE "AlgorithmRegisterStatus" ADD VALUE IF NOT EXISTS 'review' BEFORE 'published';

-- AlterTable
ALTER TABLE "PublicDecisionRecord" ADD COLUMN IF NOT EXISTS "impactedSystems" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "PublicDecisionRecord" ADD COLUMN IF NOT EXISTS "charterVersion" TEXT;
ALTER TABLE "PublicDecisionRecord" ADD COLUMN IF NOT EXISTS "disputeContact" TEXT;

-- AlterTable
ALTER TABLE "PersonalDataVaultRequest" ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT;
ALTER TABLE "PersonalDataVaultRequest" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "PersonalDataVaultRequest" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "PersonalDataVaultRequest" ADD COLUMN IF NOT EXISTS "bundleJson" JSONB;

-- AlterTable
ALTER TABLE "ResearchSafeRoomProject" ADD COLUMN IF NOT EXISTS "datasetMetadataJson" JSONB;
ALTER TABLE "ResearchSafeRoomProject" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "ResearchSafeRoomProject" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RegisteredAlgorithm" ADD COLUMN IF NOT EXISTS "reviewDueAt" TIMESTAMP(3);
ALTER TABLE "RegisteredAlgorithm" ADD COLUMN IF NOT EXISTS "linkedPolicyKey" TEXT;
ALTER TABLE "RegisteredAlgorithm" ADD COLUMN IF NOT EXISTS "disputeContact" TEXT;

-- AlterTable
ALTER TABLE "OversightBoardMeeting" ADD COLUMN IF NOT EXISTS "minutesSummary" TEXT;

-- AlterTable
ALTER TABLE "OversightBoardDecision" ADD COLUMN IF NOT EXISTS "disputeContact" TEXT;
