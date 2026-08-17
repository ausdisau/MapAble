-- CareOS Foundation is participant-owned, advisory, and read-only with
-- respect to operational care and transport records.
CREATE TABLE "participant_life_twins" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "preferences" JSONB NOT NULL DEFAULT '{}',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "participant_life_twins_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "participant_life_twins_participantId_key" ON "participant_life_twins"("participantId");
CREATE INDEX "participant_life_twins_participantId_deletedAt_idx" ON "participant_life_twins"("participantId", "deletedAt");
ALTER TABLE "participant_life_twins" ADD CONSTRAINT "participant_life_twins_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "participant_preference_memories" (
  "id" TEXT NOT NULL,
  "lifeTwinId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "source" TEXT NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "consentScope" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "participant_preference_memories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "participant_preference_memories_lifeTwinId_key_key" ON "participant_preference_memories"("lifeTwinId", "key");
CREATE INDEX "participant_preference_memories_participantId_deletedAt_idx" ON "participant_preference_memories"("participantId", "deletedAt");
ALTER TABLE "participant_preference_memories" ADD CONSTRAINT "participant_preference_memories_lifeTwinId_fkey" FOREIGN KEY ("lifeTwinId") REFERENCES "participant_life_twins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "careos_missions" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "missionType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'proposed',
  "inputSummary" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "careos_missions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "careos_missions_requestId_key" ON "careos_missions"("requestId");
CREATE INDEX "careos_missions_participantId_createdAt_idx" ON "careos_missions"("participantId", "createdAt");
ALTER TABLE "careos_missions" ADD CONSTRAINT "careos_missions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "careos_recommendations" (
  "id" TEXT NOT NULL,
  "missionId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "confidence" TEXT NOT NULL,
  "uncertainty" JSONB NOT NULL DEFAULT '[]',
  "result" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "careos_recommendations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "careos_recommendations_missionId_createdAt_idx" ON "careos_recommendations"("missionId", "createdAt");
ALTER TABLE "careos_recommendations" ADD CONSTRAINT "careos_recommendations_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "careos_evidence_references" (
  "id" TEXT NOT NULL,
  "recommendationId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "sourceDate" TIMESTAMP(3),
  "summary" TEXT NOT NULL,
  "verificationStatus" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "careos_evidence_references_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "careos_evidence_references_recommendationId_idx" ON "careos_evidence_references"("recommendationId");
ALTER TABLE "careos_evidence_references" ADD CONSTRAINT "careos_evidence_references_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "careos_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "careos_activity_events" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "requestId" TEXT,
  "eventType" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "auditEventId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "careos_activity_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "careos_activity_events_participantId_createdAt_idx" ON "careos_activity_events"("participantId", "createdAt");
ALTER TABLE "careos_activity_events" ADD CONSTRAINT "careos_activity_events_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
