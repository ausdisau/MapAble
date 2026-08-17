-- WorkflowRun historically landed via schema/db push without a CREATE migration.
-- Ensure the base table exists before additive ALTER columns for empty-DB deploy.
CREATE TABLE IF NOT EXISTS "WorkflowRun" (
  "id" TEXT NOT NULL,
  "workflowKey" TEXT NOT NULL,
  "workflowRunId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'running',
  "entityType" TEXT,
  "entityId" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "metadataJson" JSONB,
  CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "WorkflowRun_workflowKey_status_idx"
  ON "WorkflowRun"("workflowKey", "status");

ALTER TABLE "WorkflowRun"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT,
  ADD COLUMN IF NOT EXISTS "participantId" TEXT,
  ADD COLUMN IF NOT EXISTS "missionId" TEXT,
  ADD COLUMN IF NOT EXISTS "currentStep" TEXT,
  ADD COLUMN IF NOT EXISTS "nextRunAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "maximumAttempts" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS "lastError" TEXT;

CREATE INDEX IF NOT EXISTS "WorkflowRun_tenantId_status_nextRunAt_idx"
  ON "WorkflowRun"("tenantId", "status", "nextRunAt");

CREATE TABLE IF NOT EXISTS "cloud_event_outbox" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "topic" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "participantId" TEXT,
  "missionId" TEXT,
  "sourceModule" TEXT NOT NULL,
  "sourceEntityId" TEXT,
  "correlationId" TEXT NOT NULL,
  "causationId" TEXT,
  "traceId" TEXT NOT NULL,
  "payloadJson" JSONB NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3),
  "lastError" TEXT,
  "deadLetteredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cloud_event_outbox_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "cloud_event_outbox_publishedAt_nextAttemptAt_idx"
  ON "cloud_event_outbox"("publishedAt", "nextAttemptAt");
CREATE INDEX IF NOT EXISTS "cloud_event_outbox_tenantId_topic_occurredAt_idx"
  ON "cloud_event_outbox"("tenantId", "topic", "occurredAt");
CREATE INDEX IF NOT EXISTS "cloud_event_outbox_correlationId_idx"
  ON "cloud_event_outbox"("correlationId");
CREATE INDEX IF NOT EXISTS "cloud_event_outbox_missionId_occurredAt_idx"
  ON "cloud_event_outbox"("missionId", "occurredAt");
DO $$ BEGIN
  ALTER TABLE "cloud_event_outbox"
    ADD CONSTRAINT "cloud_event_outbox_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
