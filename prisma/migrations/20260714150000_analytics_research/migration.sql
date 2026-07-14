-- CreateEnum
CREATE TYPE "MetricDefinitionStatus" AS ENUM ('draft', 'published', 'deprecated');

-- CreateEnum
CREATE TYPE "AnalyticsEventStatus" AS ENUM ('received', 'processed', 'suppressed');

-- CreateEnum
CREATE TYPE "AnalyticsExportStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'completed', 'withdrawn');

-- CreateEnum
CREATE TYPE "ResearchProjectStatus" AS ENUM ('draft', 'ethics_review', 'active', 'paused', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "EthicsApprovalStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "DataUseAgreementStatus" AS ENUM ('draft', 'pending', 'active', 'revoked');

-- CreateEnum
CREATE TYPE "ResearchConsentStatus" AS ENUM ('invited', 'granted', 'declined', 'withdrawn');

-- CreateEnum
CREATE TYPE "ResearchExportStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'completed', 'blocked_withdrawal');

-- CreateEnum
CREATE TYPE "PublicationRecordStatus" AS ENUM ('draft', 'submitted', 'published', 'retracted');

-- CreateTable
CREATE TABLE "metric_definitions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "module" TEXT NOT NULL,
    "status" "MetricDefinitionStatus" NOT NULL DEFAULT 'draft',
    "formula" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metric_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_dimensions" (
    "id" TEXT NOT NULL,
    "metricDefinitionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dataType" TEXT NOT NULL DEFAULT 'string',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metric_dimensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "metricDefinitionId" TEXT,
    "eventType" TEXT NOT NULL,
    "organisationId" TEXT,
    "participantPseudonym" TEXT,
    "payloadJson" JSONB NOT NULL,
    "status" "AnalyticsEventStatus" NOT NULL DEFAULT 'received',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_snapshots" (
    "id" TEXT NOT NULL,
    "metricDefinitionId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION,
    "dimensionsJson" JSONB,
    "cohortSize" INTEGER NOT NULL DEFAULT 0,
    "suppressed" BOOLEAN NOT NULL DEFAULT false,
    "suppressionReason" TEXT,
    "deidentificationLevel" TEXT NOT NULL DEFAULT 'aggregated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_exports" (
    "id" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "organisationId" TEXT,
    "exportLabel" TEXT NOT NULL,
    "status" "AnalyticsExportStatus" NOT NULL DEFAULT 'draft',
    "deidentificationLevel" TEXT NOT NULL DEFAULT 'pseudonymised',
    "suppressedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "smallCellApplied" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "bundleJson" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ResearchProjectStatus" NOT NULL DEFAULT 'draft',
    "organisationId" TEXT,
    "principalInvestigator" TEXT,
    "syntheticDataOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ethics_approvals" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "approvalNumber" TEXT,
    "status" "EthicsApprovalStatus" NOT NULL DEFAULT 'pending',
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "conditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ethics_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_use_agreements" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "status" "DataUseAgreementStatus" NOT NULL DEFAULT 'draft',
    "approvedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_use_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_research_consents" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "ResearchConsentStatus" NOT NULL DEFAULT 'invited',
    "grantedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "consentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participant_research_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_cohorts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "criteriaJson" JSONB,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "suppressed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_exports" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "exportLabel" TEXT NOT NULL,
    "status" "ResearchExportStatus" NOT NULL DEFAULT 'draft',
    "deidentificationLevel" TEXT NOT NULL DEFAULT 'pseudonymised',
    "ethicsChecked" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "bundleJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_withdrawals" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "reason" TEXT,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exportBlocked" BOOLEAN NOT NULL DEFAULT true,
    "dataPurged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publication_records" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "doi" TEXT,
    "status" "PublicationRecordStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "acknowledgement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publication_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "metric_definitions_key_key" ON "metric_definitions"("key");

-- CreateIndex
CREATE INDEX "metric_definitions_module_status_idx" ON "metric_definitions"("module", "status");

-- CreateIndex
CREATE INDEX "metric_dimensions_metricDefinitionId_idx" ON "metric_dimensions"("metricDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "metric_dimensions_metricDefinitionId_key_key" ON "metric_dimensions"("metricDefinitionId", "key");

-- CreateIndex
CREATE INDEX "analytics_events_eventType_occurredAt_idx" ON "analytics_events"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "analytics_events_organisationId_idx" ON "analytics_events"("organisationId");

-- CreateIndex
CREATE INDEX "metric_snapshots_metricDefinitionId_periodStart_idx" ON "metric_snapshots"("metricDefinitionId", "periodStart");

-- CreateIndex
CREATE INDEX "analytics_exports_status_idx" ON "analytics_exports"("status");

-- CreateIndex
CREATE INDEX "analytics_exports_organisationId_idx" ON "analytics_exports"("organisationId");

-- CreateIndex
CREATE INDEX "research_projects_status_idx" ON "research_projects"("status");

-- CreateIndex
CREATE INDEX "research_projects_organisationId_idx" ON "research_projects"("organisationId");

-- CreateIndex
CREATE INDEX "ethics_approvals_projectId_idx" ON "ethics_approvals"("projectId");

-- CreateIndex
CREATE INDEX "data_use_agreements_projectId_idx" ON "data_use_agreements"("projectId");

-- CreateIndex
CREATE INDEX "participant_research_consents_participantId_idx" ON "participant_research_consents"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "participant_research_consents_projectId_participantId_key" ON "participant_research_consents"("projectId", "participantId");

-- CreateIndex
CREATE INDEX "research_cohorts_projectId_idx" ON "research_cohorts"("projectId");

-- CreateIndex
CREATE INDEX "research_exports_projectId_status_idx" ON "research_exports"("projectId", "status");

-- CreateIndex
CREATE INDEX "research_withdrawals_projectId_participantId_idx" ON "research_withdrawals"("projectId", "participantId");

-- CreateIndex
CREATE INDEX "publication_records_projectId_idx" ON "publication_records"("projectId");

-- AddForeignKey
ALTER TABLE "metric_dimensions" ADD CONSTRAINT "metric_dimensions_metricDefinitionId_fkey" FOREIGN KEY ("metricDefinitionId") REFERENCES "metric_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_metricDefinitionId_fkey" FOREIGN KEY ("metricDefinitionId") REFERENCES "metric_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_snapshots" ADD CONSTRAINT "metric_snapshots_metricDefinitionId_fkey" FOREIGN KEY ("metricDefinitionId") REFERENCES "metric_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_exports" ADD CONSTRAINT "analytics_exports_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_exports" ADD CONSTRAINT "analytics_exports_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_exports" ADD CONSTRAINT "analytics_exports_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_projects" ADD CONSTRAINT "research_projects_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ethics_approvals" ADD CONSTRAINT "ethics_approvals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_use_agreements" ADD CONSTRAINT "data_use_agreements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_research_consents" ADD CONSTRAINT "participant_research_consents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_research_consents" ADD CONSTRAINT "participant_research_consents_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_cohorts" ADD CONSTRAINT "research_cohorts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_exports" ADD CONSTRAINT "research_exports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_exports" ADD CONSTRAINT "research_exports_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_exports" ADD CONSTRAINT "research_exports_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_withdrawals" ADD CONSTRAINT "research_withdrawals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_withdrawals" ADD CONSTRAINT "research_withdrawals_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_records" ADD CONSTRAINT "publication_records_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
