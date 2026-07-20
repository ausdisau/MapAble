-- Assistive Technology Continuity (NDIS Expansion Wave 1)
-- Additive equipment continuity register. Flag MAPABLE_AT_CONTINUITY_ENABLED defaults false.
-- Not clinical suitability SoT. Not emergency dispatch.

CREATE TYPE "AtEquipmentCategory" AS ENUM ('mobility', 'communication', 'daily_living', 'other');
CREATE TYPE "AtOutageStatus" AS ENUM ('draft', 'reported', 'active', 'resolved', 'closed', 'withdrawn');
CREATE TYPE "AtDependencyTargetType" AS ENUM ('care_request', 'transport_trip', 'transport_trip_request', 'job', 'job_application', 'calendar_event');

CREATE TABLE "at_equipment_assets" (
    "id" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" "AtEquipmentCategory" NOT NULL,
    "mobilityAidHint" TEXT,
    "marketplaceCategoryHint" TEXT,
    "externalAssessmentRef" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "at_equipment_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "at_equipment_outages" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "AtOutageStatus" NOT NULL DEFAULT 'reported',
    "impactNotes" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "at_equipment_outages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "at_backup_plans" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "at_backup_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "at_repair_partner_refs" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "externalPartnerRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "at_repair_partner_refs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "at_dependency_links" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "targetType" "AtDependencyTargetType" NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "at_dependency_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "at_equipment_assets_participantUserId_active_idx" ON "at_equipment_assets"("participantUserId", "active");
CREATE INDEX "at_equipment_assets_participantUserId_category_idx" ON "at_equipment_assets"("participantUserId", "category");
CREATE INDEX "at_equipment_outages_assetId_status_idx" ON "at_equipment_outages"("assetId", "status");
CREATE INDEX "at_equipment_outages_participantUserId_status_idx" ON "at_equipment_outages"("participantUserId", "status");
CREATE INDEX "at_backup_plans_assetId_active_idx" ON "at_backup_plans"("assetId", "active");
CREATE INDEX "at_backup_plans_participantUserId_idx" ON "at_backup_plans"("participantUserId");
CREATE INDEX "at_repair_partner_refs_assetId_idx" ON "at_repair_partner_refs"("assetId");
CREATE INDEX "at_repair_partner_refs_participantUserId_idx" ON "at_repair_partner_refs"("participantUserId");
CREATE INDEX "at_repair_partner_refs_organisationId_idx" ON "at_repair_partner_refs"("organisationId");
CREATE INDEX "at_dependency_links_assetId_targetType_idx" ON "at_dependency_links"("assetId", "targetType");
CREATE INDEX "at_dependency_links_participantUserId_idx" ON "at_dependency_links"("participantUserId");
CREATE INDEX "at_dependency_links_targetType_targetEntityId_idx" ON "at_dependency_links"("targetType", "targetEntityId");

ALTER TABLE "at_equipment_assets" ADD CONSTRAINT "at_equipment_assets_participantUserId_fkey" FOREIGN KEY ("participantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "at_equipment_outages" ADD CONSTRAINT "at_equipment_outages_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "at_equipment_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "at_equipment_outages" ADD CONSTRAINT "at_equipment_outages_participantUserId_fkey" FOREIGN KEY ("participantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "at_backup_plans" ADD CONSTRAINT "at_backup_plans_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "at_equipment_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "at_backup_plans" ADD CONSTRAINT "at_backup_plans_participantUserId_fkey" FOREIGN KEY ("participantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "at_repair_partner_refs" ADD CONSTRAINT "at_repair_partner_refs_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "at_equipment_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "at_repair_partner_refs" ADD CONSTRAINT "at_repair_partner_refs_participantUserId_fkey" FOREIGN KEY ("participantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "at_repair_partner_refs" ADD CONSTRAINT "at_repair_partner_refs_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "at_dependency_links" ADD CONSTRAINT "at_dependency_links_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "at_equipment_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "at_dependency_links" ADD CONSTRAINT "at_dependency_links_participantUserId_fkey" FOREIGN KEY ("participantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
