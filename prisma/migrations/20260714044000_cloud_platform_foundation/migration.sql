ALTER TABLE "WorkflowRun"
  ADD COLUMN "tenantId" TEXT,
  ADD COLUMN "participantId" TEXT,
  ADD COLUMN "missionId" TEXT,
  ADD COLUMN "currentStep" TEXT,
  ADD COLUMN "nextRunAt" TIMESTAMP(3),
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maximumAttempts" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "lastError" TEXT;

CREATE INDEX "WorkflowRun_tenantId_status_nextRunAt_idx"
  ON "WorkflowRun"("tenantId", "status", "nextRunAt");

CREATE TABLE "cloud_event_outbox" (
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
CREATE INDEX "cloud_event_outbox_publishedAt_nextAttemptAt_idx"
  ON "cloud_event_outbox"("publishedAt", "nextAttemptAt");
CREATE INDEX "cloud_event_outbox_tenantId_topic_occurredAt_idx"
  ON "cloud_event_outbox"("tenantId", "topic", "occurredAt");
CREATE INDEX "cloud_event_outbox_correlationId_idx"
  ON "cloud_event_outbox"("correlationId");
CREATE INDEX "cloud_event_outbox_missionId_occurredAt_idx"
  ON "cloud_event_outbox"("missionId", "occurredAt");
ALTER TABLE "cloud_event_outbox"
  ADD CONSTRAINT "cloud_event_outbox_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
