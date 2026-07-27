CREATE TABLE "participant_goals" (
  "id" TEXT NOT NULL, "participantId" TEXT NOT NULL, "title" TEXT NOT NULL,
  "description" TEXT NOT NULL, "category" TEXT NOT NULL, "desiredBy" TIMESTAMP(3),
  "importance" TEXT, "participantLanguage" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'active',
  "revision" INTEGER NOT NULL DEFAULT 1, "supersedesGoalId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "participant_goals_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "participant_goals_participantId_status_updatedAt_idx"
  ON "participant_goals"("participantId", "status", "updatedAt");
ALTER TABLE "participant_goals" ADD CONSTRAINT "participant_goals_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "participant_provider_shortlists" (
  "id" TEXT NOT NULL, "participantId" TEXT NOT NULL, "providerOrgId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "participant_provider_shortlists_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "participant_provider_shortlists_participantId_providerOrgId_key"
  ON "participant_provider_shortlists"("participantId", "providerOrgId");
CREATE INDEX "participant_provider_shortlists_participantId_createdAt_idx"
  ON "participant_provider_shortlists"("participantId", "createdAt");
ALTER TABLE "participant_provider_shortlists" ADD CONSTRAINT "participant_provider_shortlists_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "participant_provider_shortlists" ADD CONSTRAINT "participant_provider_shortlists_providerOrgId_fkey"
  FOREIGN KEY ("providerOrgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "participant_hidden_providers" (
  "id" TEXT NOT NULL, "participantId" TEXT NOT NULL, "providerOrgId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "participant_hidden_providers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "participant_hidden_providers_participantId_providerOrgId_key"
  ON "participant_hidden_providers"("participantId", "providerOrgId");
CREATE INDEX "participant_hidden_providers_participantId_createdAt_idx"
  ON "participant_hidden_providers"("participantId", "createdAt");
ALTER TABLE "participant_hidden_providers" ADD CONSTRAINT "participant_hidden_providers_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "participant_hidden_providers" ADD CONSTRAINT "participant_hidden_providers_providerOrgId_fkey"
  FOREIGN KEY ("providerOrgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "participant_provider_notes" (
  "id" TEXT NOT NULL, "participantId" TEXT NOT NULL, "providerOrgId" TEXT NOT NULL,
  "note" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "participant_provider_notes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "participant_provider_notes_participantId_providerOrgId_key"
  ON "participant_provider_notes"("participantId", "providerOrgId");
CREATE INDEX "participant_provider_notes_participantId_updatedAt_idx"
  ON "participant_provider_notes"("participantId", "updatedAt");
ALTER TABLE "participant_provider_notes" ADD CONSTRAINT "participant_provider_notes_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "participant_provider_notes" ADD CONSTRAINT "participant_provider_notes_providerOrgId_fkey"
  FOREIGN KEY ("providerOrgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
