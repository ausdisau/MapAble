-- CareOS Phase 15 — National Infrastructure, Federation and Resilience

-- CreateEnum
CREATE TYPE "FederationTrustStatus" AS ENUM ('pending', 'active', 'suspended', 'revoked');

-- CreateEnum
CREATE TYPE "FederationProtocol" AS ENUM ('oidc', 'saml');

-- CreateEnum
CREATE TYPE "RegionalOrganisationStatus" AS ENUM ('draft', 'active', 'suspended', 'archived');

-- CreateEnum
CREATE TYPE "PlatformHealthStatus" AS ENUM ('ok', 'degraded', 'critical', 'unknown');

-- CreateEnum
CREATE TYPE "RestoreDrillOutcome" AS ENUM ('passed', 'failed', 'partial', 'not_run');

-- CreateTable
CREATE TABLE "federation_trusts" (
    "id" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "protocol" "FederationProtocol" NOT NULL,
    "issuerUrl" TEXT NOT NULL,
    "clientId" TEXT,
    "metadataUrl" TEXT,
    "status" "FederationTrustStatus" NOT NULL DEFAULT 'pending',
    "scopesAllowed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "participantAuthorityBlocked" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "federation_trusts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regional_organisations" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "federationTrustId" TEXT,
    "regionCode" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "RegionalOrganisationStatus" NOT NULL DEFAULT 'draft',
    "directoryRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regional_organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_health_checks" (
    "id" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'ap-southeast-2',
    "status" "PlatformHealthStatus" NOT NULL DEFAULT 'unknown',
    "message" TEXT,
    "latencyMs" INTEGER,
    "redacted" BOOLEAN NOT NULL DEFAULT true,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restore_drill_records" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'staging',
    "outcome" "RestoreDrillOutcome" NOT NULL DEFAULT 'not_run',
    "rpoAchievedMin" INTEGER,
    "rtoAchievedMin" INTEGER,
    "testedAt" TIMESTAMP(3),
    "evidenceJson" JSONB,
    "notes" TEXT,
    "conductedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restore_drill_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "federation_trusts_status_idx" ON "federation_trusts"("status");

-- CreateIndex
CREATE INDEX "federation_trusts_protocol_idx" ON "federation_trusts"("protocol");

-- CreateIndex
CREATE INDEX "regional_organisations_regionCode_idx" ON "regional_organisations"("regionCode");

-- CreateIndex
CREATE INDEX "regional_organisations_organisationId_idx" ON "regional_organisations"("organisationId");

-- CreateIndex
CREATE INDEX "regional_organisations_federationTrustId_idx" ON "regional_organisations"("federationTrustId");

-- CreateIndex
CREATE INDEX "platform_health_checks_component_checkedAt_idx" ON "platform_health_checks"("component", "checkedAt");

-- CreateIndex
CREATE INDEX "platform_health_checks_region_status_idx" ON "platform_health_checks"("region", "status");

-- CreateIndex
CREATE INDEX "restore_drill_records_environment_testedAt_idx" ON "restore_drill_records"("environment", "testedAt");

-- CreateIndex
CREATE INDEX "restore_drill_records_outcome_idx" ON "restore_drill_records"("outcome");

-- AddForeignKey
ALTER TABLE "regional_organisations" ADD CONSTRAINT "regional_organisations_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regional_organisations" ADD CONSTRAINT "regional_organisations_federationTrustId_fkey" FOREIGN KEY ("federationTrustId") REFERENCES "federation_trusts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restore_drill_records" ADD CONSTRAINT "restore_drill_records_conductedById_fkey" FOREIGN KEY ("conductedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
