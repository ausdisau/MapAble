-- CareOS top-ten opportunity MVPs (additive; no claim/eligibility automation)

CREATE TABLE IF NOT EXISTS "platform_registration_packs" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "claimSubmissionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "exportedAt" TIMESTAMP(3),
    "exportJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "platform_registration_packs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "platform_registration_checklist_items" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "standardKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "evidenceRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "platform_registration_checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_registration_checklist_items_packId_standardKey_key"
  ON "platform_registration_checklist_items"("packId", "standardKey");
CREATE INDEX IF NOT EXISTS "platform_registration_packs_organisationId_status_idx"
  ON "platform_registration_packs"("organisationId", "status");
CREATE INDEX IF NOT EXISTS "platform_registration_packs_tenantId_status_idx"
  ON "platform_registration_packs"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "platform_registration_checklist_items_packId_status_idx"
  ON "platform_registration_checklist_items"("packId", "status");

ALTER TABLE "platform_registration_checklist_items"
  DROP CONSTRAINT IF EXISTS "platform_registration_checklist_items_packId_fkey";
ALTER TABLE "platform_registration_checklist_items"
  ADD CONSTRAINT "platform_registration_checklist_items_packId_fkey"
  FOREIGN KEY ("packId") REFERENCES "platform_registration_packs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "academy_competency_proposals" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "courseId" TEXT,
    "trainingCompletionId" TEXT,
    "competencyType" TEXT NOT NULL,
    "evidenceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "proposedByUserId" TEXT NOT NULL,
    "verifiedByUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "academy_competency_proposals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "academy_competency_proposals_workerProfileId_status_idx"
  ON "academy_competency_proposals"("workerProfileId", "status");
CREATE INDEX IF NOT EXISTS "academy_competency_proposals_status_createdAt_idx"
  ON "academy_competency_proposals"("status", "createdAt");

CREATE TABLE IF NOT EXISTS "thin_market_continuity_signals" (
    "id" TEXT NOT NULL,
    "regionKey" TEXT NOT NULL,
    "serviceCategory" TEXT NOT NULL,
    "capacityStatus" TEXT NOT NULL,
    "notes" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiresHumanConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "confirmedAt" TIMESTAMP(3),
    "confirmedByUserId" TEXT,
    "tenantId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "thin_market_continuity_signals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "thin_market_continuity_signals_regionKey_serviceCategory_idx"
  ON "thin_market_continuity_signals"("regionKey", "serviceCategory");
CREATE INDEX IF NOT EXISTS "thin_market_continuity_signals_capacityStatus_observedAt_idx"
  ON "thin_market_continuity_signals"("capacityStatus", "observedAt");

CREATE TABLE IF NOT EXISTS "lifespan_liaison_briefs" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "missionId" TEXT,
    "schemeFrom" TEXT NOT NULL,
    "schemeTo" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "ypiracCautionShown" BOOLEAN NOT NULL DEFAULT true,
    "authorityDecisionId" TEXT,
    "createdById" TEXT NOT NULL,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lifespan_liaison_briefs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lifespan_liaison_briefs_participantId_createdAt_idx"
  ON "lifespan_liaison_briefs"("participantId", "createdAt");
CREATE INDEX IF NOT EXISTS "lifespan_liaison_briefs_missionId_idx"
  ON "lifespan_liaison_briefs"("missionId");

CREATE TABLE IF NOT EXISTS "tenant_access_denials" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "attemptedTenantId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_access_denials_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "tenant_access_denials_actorUserId_createdAt_idx"
  ON "tenant_access_denials"("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "tenant_access_denials_attemptedTenantId_createdAt_idx"
  ON "tenant_access_denials"("attemptedTenantId", "createdAt");
