-- Canonical CareOSMission: extend tip table; add child tables from fabric (additive, no dual CREATE of careos_missions).

ALTER TABLE "careos_missions" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "careos_missions" ADD COLUMN IF NOT EXISTS "desiredOutcome" TEXT NOT NULL DEFAULT '';
ALTER TABLE "careos_missions" ADD COLUMN IF NOT EXISTS "authorityDecisionId" TEXT;
ALTER TABLE "careos_missions" ADD COLUMN IF NOT EXISTS "graphJson" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "careos_missions" ADD COLUMN IF NOT EXISTS "modulesJson" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "careos_missions" ADD COLUMN IF NOT EXISTS "alertsJson" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "careos_missions" ADD COLUMN IF NOT EXISTS "proposalsJson" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "careos_missions" ADD COLUMN IF NOT EXISTS "stateVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "careos_missions" ADD COLUMN IF NOT EXISTS "correlationId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "careos_missions" ADD COLUMN IF NOT EXISTS "workflowRunId" TEXT;

-- Backfill correlationId for existing rows
UPDATE "careos_missions" SET "correlationId" = "id" WHERE "correlationId" = '' OR "correlationId" IS NULL;

-- Make inputSummary optional-compatible (already NOT NULL in foundation — ensure default)
ALTER TABLE "careos_missions" ALTER COLUMN "inputSummary" SET DEFAULT '{}';

CREATE INDEX IF NOT EXISTS "careos_missions_tenantId_status_idx" ON "careos_missions"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "careos_missions_correlationId_idx" ON "careos_missions"("correlationId");
CREATE INDEX IF NOT EXISTS "careos_missions_missionType_status_idx" ON "careos_missions"("missionType", "status");

CREATE TABLE IF NOT EXISTS "careos_mission_events" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "sourceEntityId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'information',
    "summary" TEXT NOT NULL,
    "payloadJson" JSONB,
    "eventKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "careos_mission_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "careos_mission_events_missionId_eventKey_key" ON "careos_mission_events"("missionId", "eventKey");
CREATE INDEX IF NOT EXISTS "careos_mission_events_missionId_createdAt_idx" ON "careos_mission_events"("missionId", "createdAt");
CREATE INDEX IF NOT EXISTS "careos_mission_events_participantId_createdAt_idx" ON "careos_mission_events"("participantId", "createdAt");

CREATE TABLE IF NOT EXISTS "careos_human_reviews" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "assignedRole" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "participantContactRequired" BOOLEAN NOT NULL DEFAULT true,
    "evidenceJson" JSONB NOT NULL DEFAULT '[]',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "careos_human_reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "careos_human_reviews_participantId_status_idx" ON "careos_human_reviews"("participantId", "status");
CREATE INDEX IF NOT EXISTS "careos_human_reviews_assignedRole_status_idx" ON "careos_human_reviews"("assignedRole", "status");
CREATE INDEX IF NOT EXISTS "careos_human_reviews_missionId_createdAt_idx" ON "careos_human_reviews"("missionId", "createdAt");

CREATE TABLE IF NOT EXISTS "careos_action_receipts" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "missionId" TEXT,
    "actionType" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'claimed',
    "resultEntityType" TEXT,
    "resultEntityId" TEXT,
    "errorCode" TEXT,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "careos_action_receipts_pkey" PRIMARY KEY ("id")
);

-- If 20260713110000 already created the table without missionId, add it before
-- indexing (CREATE TABLE IF NOT EXISTS is a no-op against the earlier shape).
ALTER TABLE "careos_action_receipts" ADD COLUMN IF NOT EXISTS "missionId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "careos_action_receipts_tokenId_key" ON "careos_action_receipts"("tokenId");
CREATE INDEX IF NOT EXISTS "careos_action_receipts_participantId_claimedAt_idx" ON "careos_action_receipts"("participantId", "claimedAt");
CREATE INDEX IF NOT EXISTS "careos_action_receipts_requestId_idx" ON "careos_action_receipts"("requestId");
CREATE INDEX IF NOT EXISTS "careos_action_receipts_missionId_idx" ON "careos_action_receipts"("missionId");

CREATE TABLE IF NOT EXISTS "careos_participant_preferences" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "preferenceKey" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'participant_confirmed',
    "status" TEXT NOT NULL DEFAULT 'active',
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "careos_participant_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "careos_participant_preferences_participantId_preferenceKey_key" ON "careos_participant_preferences"("participantId", "preferenceKey");
CREATE INDEX IF NOT EXISTS "careos_participant_preferences_participantId_status_idx" ON "careos_participant_preferences"("participantId", "status");

DO $$ BEGIN
  ALTER TABLE "careos_mission_events" ADD CONSTRAINT "careos_mission_events_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "careos_mission_events" ADD CONSTRAINT "careos_mission_events_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "careos_human_reviews" ADD CONSTRAINT "careos_human_reviews_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "careos_human_reviews" ADD CONSTRAINT "careos_human_reviews_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "careos_action_receipts" ADD CONSTRAINT "careos_action_receipts_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "careos_action_receipts" ADD CONSTRAINT "careos_action_receipts_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "careos_participant_preferences" ADD CONSTRAINT "careos_participant_preferences_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
