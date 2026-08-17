-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "NavigatorMemoryCategory" AS ENUM (
    'explicit_preference',
    'communication_requirement',
    'accessibility_requirement',
    'participant_exclusion',
    'consented_workflow_state'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NavigatorMemoryVerification" AS ENUM (
    'participant_stated',
    'corrected',
    'withdrawn',
    'deleted'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "navigator_decision_passports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "goalSummary" TEXT NOT NULL,
    "interpretationJson" JSONB NOT NULL DEFAULT '{}',
    "hardConstraintsJson" JSONB NOT NULL DEFAULT '[]',
    "rankingWeightsJson" JSONB NOT NULL DEFAULT '{}',
    "sourcesJson" JSONB NOT NULL DEFAULT '[]',
    "shortlistJson" JSONB NOT NULL DEFAULT '[]',
    "uncertaintyNotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "limitationsNotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "conflictsOfInterest" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiInvolved" BOOLEAN NOT NULL DEFAULT false,
    "modelIndependentRules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nextStep" TEXT,
    "nextStepController" TEXT NOT NULL DEFAULT 'participant',
    "consentedPurpose" TEXT NOT NULL,
    "consentRecordId" TEXT,
    "aiOptedOut" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigator_decision_passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "navigator_governed_memory_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "category" "NavigatorMemoryCategory" NOT NULL,
    "contentSummary" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    "verification" "NavigatorMemoryVerification" NOT NULL DEFAULT 'participant_stated',
    "creatingActorId" TEXT NOT NULL,
    "consentRecordId" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'stated',
    "expiresAt" TIMESTAMP(3),
    "correctedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "navigator_governed_memory_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "navigator_decision_passports_tenantId_participantId_createdAt_idx"
  ON "navigator_decision_passports"("tenantId", "participantId", "createdAt");
CREATE INDEX IF NOT EXISTS "navigator_decision_passports_sessionId_idx"
  ON "navigator_decision_passports"("sessionId");
CREATE INDEX IF NOT EXISTS "navigator_governed_memory_items_tenantId_participantId_category_idx"
  ON "navigator_governed_memory_items"("tenantId", "participantId", "category");
CREATE INDEX IF NOT EXISTS "navigator_governed_memory_items_expiresAt_idx"
  ON "navigator_governed_memory_items"("expiresAt");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "navigator_decision_passports"
    ADD CONSTRAINT "navigator_decision_passports_participantId_fkey"
    FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "navigator_governed_memory_items"
    ADD CONSTRAINT "navigator_governed_memory_items_participantId_fkey"
    FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
