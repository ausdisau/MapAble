CREATE TABLE "careos_missions" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "modules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "graphJson" JSONB NOT NULL DEFAULT '{}',
    "alertsJson" JSONB NOT NULL DEFAULT '[]',
    "proposalsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "careos_missions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "careos_missions_requestId_key" UNIQUE ("requestId"),
    CONSTRAINT "careos_missions_status_check" CHECK ("status" IN ('ready', 'needs_information', 'human_review_required', 'completed', 'cancelled'))
);

CREATE TABLE "careos_mission_events" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "sourceEntityId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'information',
    "summary" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "careos_mission_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "careos_mission_events_severity_check" CHECK ("severity" IN ('information', 'attention', 'urgent'))
);

CREATE TABLE "careos_human_reviews" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "careos_human_reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "careos_human_reviews_priority_check" CHECK ("priority" IN ('information', 'attention', 'urgent')),
    CONSTRAINT "careos_human_reviews_status_check" CHECK ("status" IN ('open', 'assigned', 'in_progress', 'resolved', 'cancelled'))
);

CREATE TABLE "careos_participant_preferences" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "preferenceKey" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'participant_confirmed',
    "status" TEXT NOT NULL DEFAULT 'active',
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "careos_participant_preferences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "careos_participant_preferences_participantId_preferenceKey_key" UNIQUE ("participantId", "preferenceKey"),
    CONSTRAINT "careos_participant_preferences_status_check" CHECK ("status" IN ('active', 'revoked', 'expired'))
);

CREATE INDEX "careos_missions_participantId_createdAt_idx" ON "careos_missions"("participantId", "createdAt");
CREATE INDEX "careos_mission_events_missionId_createdAt_idx" ON "careos_mission_events"("missionId", "createdAt");
CREATE INDEX "careos_human_reviews_participantId_status_idx" ON "careos_human_reviews"("participantId", "status");
CREATE INDEX "careos_human_reviews_assignedRole_status_idx" ON "careos_human_reviews"("assignedRole", "status");
CREATE INDEX "careos_participant_preferences_participantId_status_idx" ON "careos_participant_preferences"("participantId", "status");

ALTER TABLE "careos_missions" ADD CONSTRAINT "careos_missions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "careos_mission_events" ADD CONSTRAINT "careos_mission_events_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "careos_mission_events" ADD CONSTRAINT "careos_mission_events_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "careos_human_reviews" ADD CONSTRAINT "careos_human_reviews_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "careos_human_reviews" ADD CONSTRAINT "careos_human_reviews_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "careos_participant_preferences" ADD CONSTRAINT "careos_participant_preferences_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
