-- Shared programme foundation (Prompt 0)

-- CreateEnum
CREATE TYPE "ProgrammeSourceType" AS ENUM ('legislation', 'regulation', 'government_guidance', 'standard', 'scheme_rule', 'service_directory', 'government_dataset', 'partner_api', 'organisational_policy', 'clinical_document', 'community_observation');

-- CreateEnum
CREATE TYPE "ProgrammeSourceAuthorityStatus" AS ENUM ('authoritative', 'draft', 'consultation', 'superseded', 'organisational_interpretation', 'requires_human_review');

-- CreateEnum
CREATE TYPE "ProgrammeSourceImpactReviewStatus" AS ENUM ('pending', 'in_review', 'no_action_required', 'rule_update_proposed', 'completed');

-- CreateEnum
CREATE TYPE "ParticipantAuthorityGrantStatus" AS ENUM ('active', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "NavigatorVisibility" AS ENUM ('public', 'community', 'private');

-- CreateEnum
CREATE TYPE "NavigatorRequestStatus" AS ENUM ('draft', 'pending_participant_approval', 'submitted', 'assigned', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "NavigatorAssignmentStatus" AS ENUM ('pending', 'active', 'handover_pending', 'completed', 'revoked');

-- CreateEnum
CREATE TYPE "ServiceRelationshipRole" AS ENUM ('service_provider', 'worker_employer', 'worker_engager', 'platform', 'property_owner', 'property_manager', 'tenancy_manager', 'maintenance_provider', 'support_provider', 'payment_processor');

-- CreateEnum
CREATE TYPE "TrustSnapshotStatus" AS ENUM ('draft', 'active', 'superseded');

-- CreateTable
CREATE TABLE "programme_source_records" (
    "id" TEXT NOT NULL,
    "sourceOrganisation" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" "ProgrammeSourceType" NOT NULL,
    "version" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "retrievalDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorityStatus" "ProgrammeSourceAuthorityStatus" NOT NULL DEFAULT 'authoritative',
    "licence" TEXT,
    "attribution" TEXT,
    "sourceHash" TEXT,
    "affectedProgrammes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewOwnerId" TEXT,
    "nextReviewAt" TIMESTAMP(3),
    "supersedingSourceId" TEXT,
    "regulatorySourceVersionId" TEXT,
    "metadataJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programme_source_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programme_source_impact_reviews" (
    "id" TEXT NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "status" "ProgrammeSourceImpactReviewStatus" NOT NULL DEFAULT 'pending',
    "summary" TEXT NOT NULL,
    "findingsJson" JSONB NOT NULL DEFAULT '{}',
    "reviewOwnerId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programme_source_impact_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_authority_grants" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "granteeUserId" TEXT,
    "granteeOrganisationId" TEXT,
    "purpose" TEXT NOT NULL,
    "allowedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowedActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ParticipantAuthorityGrantStatus" NOT NULL DEFAULT 'active',
    "consentRecordId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "revokedById" TEXT,
    "revokedAt" TIMESTAMP(3),
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participant_authority_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigator_organisations" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "NavigatorVisibility" NOT NULL DEFAULT 'community',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigator_organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigator_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "navigatorOrganisationId" TEXT,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "visibility" "NavigatorVisibility" NOT NULL DEFAULT 'public',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigator_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigator_specialisms" (
    "id" TEXT NOT NULL,
    "navigatorId" TEXT NOT NULL,
    "specialism" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "navigator_specialisms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigator_availability" (
    "id" TEXT NOT NULL,
    "navigatorId" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "startTime" TEXT,
    "endTime" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigator_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigator_regions" (
    "id" TEXT NOT NULL,
    "navigatorId" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "regionName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "navigator_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigator_languages" (
    "id" TEXT NOT NULL,
    "navigatorId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "proficiency" TEXT NOT NULL DEFAULT 'fluent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "navigator_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigator_communication_capabilities" (
    "id" TEXT NOT NULL,
    "navigatorId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "navigator_communication_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigator_credential_references" (
    "id" TEXT NOT NULL,
    "navigatorId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "issuer" TEXT,
    "referenceId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "navigator_credential_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigator_requests" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "missionId" TEXT,
    "caseId" TEXT,
    "status" "NavigatorRequestStatus" NOT NULL DEFAULT 'draft',
    "goalSummary" TEXT NOT NULL,
    "sharedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredModes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "correlationId" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigator_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigator_assignments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "navigatorId" TEXT NOT NULL,
    "navigatorProfileId" TEXT,
    "navigatorOrganisationId" TEXT,
    "status" "NavigatorAssignmentStatus" NOT NULL DEFAULT 'pending',
    "sharedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "participantApprovedAt" TIMESTAMP(3),
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigator_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigator_handovers" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "fromNavigatorId" TEXT NOT NULL,
    "toNavigatorId" TEXT NOT NULL,
    "sharedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "summary" TEXT NOT NULL,
    "participantApprovedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "navigator_handovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigator_outcomes" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "outcomeJson" JSONB NOT NULL DEFAULT '{}',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "navigator_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigator_feedback" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "navigator_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_relationship_records" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "providerOrganisationId" TEXT,
    "platformOrganisationId" TEXT,
    "bookingId" TEXT,
    "careRequestId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_relationship_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_role_disclosures" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "role" "ServiceRelationshipRole" NOT NULL,
    "organisationName" TEXT,
    "description" TEXT NOT NULL,
    "isMapAble" BOOLEAN NOT NULL DEFAULT false,
    "paymentPathway" TEXT,
    "complaintPathway" TEXT,
    "insuranceNotes" TEXT,
    "credentialChecked" BOOLEAN NOT NULL DEFAULT false,
    "credentialNotes" TEXT,
    "conflictFlag" BOOLEAN NOT NULL DEFAULT false,
    "consentRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_role_disclosures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_relationship_snapshots" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "status" "TrustSnapshotStatus" NOT NULL DEFAULT 'active',
    "feeComponentsJson" JSONB NOT NULL DEFAULT '[]',
    "quoteSnapshotJson" JSONB,
    "agreementSnapshotJson" JSONB,
    "invoiceSnapshotJson" JSONB,
    "disclosureJson" JSONB NOT NULL DEFAULT '{}',
    "informationalOnly" BOOLEAN NOT NULL DEFAULT true,
    "correlationId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_relationship_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "programme_source_records_jurisdiction_sourceType_idx" ON "programme_source_records"("jurisdiction", "sourceType");

-- CreateIndex
CREATE INDEX "programme_source_records_authorityStatus_idx" ON "programme_source_records"("authorityStatus");

-- CreateIndex
CREATE INDEX "programme_source_records_supersedingSourceId_idx" ON "programme_source_records"("supersedingSourceId");

-- CreateIndex
CREATE INDEX "programme_source_impact_reviews_sourceRecordId_status_idx" ON "programme_source_impact_reviews"("sourceRecordId", "status");

-- CreateIndex
CREATE INDEX "participant_authority_grants_participantId_status_idx" ON "participant_authority_grants"("participantId", "status");

-- CreateIndex
CREATE INDEX "participant_authority_grants_granteeUserId_idx" ON "participant_authority_grants"("granteeUserId");

-- CreateIndex
CREATE INDEX "participant_authority_grants_expiresAt_idx" ON "participant_authority_grants"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "navigator_organisations_organisationId_key" ON "navigator_organisations"("organisationId");

-- CreateIndex
CREATE INDEX "navigator_profiles_userId_idx" ON "navigator_profiles"("userId");

-- CreateIndex
CREATE INDEX "navigator_profiles_isActive_visibility_idx" ON "navigator_profiles"("isActive", "visibility");

-- CreateIndex
CREATE INDEX "navigator_specialisms_navigatorId_idx" ON "navigator_specialisms"("navigatorId");

-- CreateIndex
CREATE INDEX "navigator_availability_navigatorId_idx" ON "navigator_availability"("navigatorId");

-- CreateIndex
CREATE INDEX "navigator_regions_navigatorId_regionCode_idx" ON "navigator_regions"("navigatorId", "regionCode");

-- CreateIndex
CREATE INDEX "navigator_languages_navigatorId_idx" ON "navigator_languages"("navigatorId");

-- CreateIndex
CREATE INDEX "navigator_communication_capabilities_navigatorId_idx" ON "navigator_communication_capabilities"("navigatorId");

-- CreateIndex
CREATE INDEX "navigator_credential_references_navigatorId_idx" ON "navigator_credential_references"("navigatorId");

-- CreateIndex
CREATE INDEX "navigator_requests_participantId_status_idx" ON "navigator_requests"("participantId", "status");

-- CreateIndex
CREATE INDEX "navigator_assignments_participantId_status_idx" ON "navigator_assignments"("participantId", "status");

-- CreateIndex
CREATE INDEX "navigator_assignments_navigatorId_status_idx" ON "navigator_assignments"("navigatorId", "status");

-- CreateIndex
CREATE INDEX "navigator_handovers_assignmentId_idx" ON "navigator_handovers"("assignmentId");

-- CreateIndex
CREATE INDEX "navigator_outcomes_assignmentId_idx" ON "navigator_outcomes"("assignmentId");

-- CreateIndex
CREATE INDEX "navigator_feedback_assignmentId_idx" ON "navigator_feedback"("assignmentId");

-- CreateIndex
CREATE INDEX "service_relationship_records_participantId_idx" ON "service_relationship_records"("participantId");

-- CreateIndex
CREATE INDEX "service_role_disclosures_relationshipId_idx" ON "service_role_disclosures"("relationshipId");

-- CreateIndex
CREATE INDEX "trust_relationship_snapshots_relationshipId_status_idx" ON "trust_relationship_snapshots"("relationshipId", "status");

-- AddForeignKey
ALTER TABLE "programme_source_records" ADD CONSTRAINT "programme_source_records_reviewOwnerId_fkey" FOREIGN KEY ("reviewOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programme_source_records" ADD CONSTRAINT "programme_source_records_supersedingSourceId_fkey" FOREIGN KEY ("supersedingSourceId") REFERENCES "programme_source_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programme_source_impact_reviews" ADD CONSTRAINT "programme_source_impact_reviews_sourceRecordId_fkey" FOREIGN KEY ("sourceRecordId") REFERENCES "programme_source_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programme_source_impact_reviews" ADD CONSTRAINT "programme_source_impact_reviews_reviewOwnerId_fkey" FOREIGN KEY ("reviewOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_authority_grants" ADD CONSTRAINT "participant_authority_grants_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_authority_grants" ADD CONSTRAINT "participant_authority_grants_granteeUserId_fkey" FOREIGN KEY ("granteeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_authority_grants" ADD CONSTRAINT "participant_authority_grants_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_authority_grants" ADD CONSTRAINT "participant_authority_grants_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_organisations" ADD CONSTRAINT "navigator_organisations_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_profiles" ADD CONSTRAINT "navigator_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_profiles" ADD CONSTRAINT "navigator_profiles_navigatorOrganisationId_fkey" FOREIGN KEY ("navigatorOrganisationId") REFERENCES "navigator_organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_specialisms" ADD CONSTRAINT "navigator_specialisms_navigatorId_fkey" FOREIGN KEY ("navigatorId") REFERENCES "navigator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_availability" ADD CONSTRAINT "navigator_availability_navigatorId_fkey" FOREIGN KEY ("navigatorId") REFERENCES "navigator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_regions" ADD CONSTRAINT "navigator_regions_navigatorId_fkey" FOREIGN KEY ("navigatorId") REFERENCES "navigator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_languages" ADD CONSTRAINT "navigator_languages_navigatorId_fkey" FOREIGN KEY ("navigatorId") REFERENCES "navigator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_communication_capabilities" ADD CONSTRAINT "navigator_communication_capabilities_navigatorId_fkey" FOREIGN KEY ("navigatorId") REFERENCES "navigator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_credential_references" ADD CONSTRAINT "navigator_credential_references_navigatorId_fkey" FOREIGN KEY ("navigatorId") REFERENCES "navigator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_requests" ADD CONSTRAINT "navigator_requests_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_assignments" ADD CONSTRAINT "navigator_assignments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "navigator_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_assignments" ADD CONSTRAINT "navigator_assignments_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_assignments" ADD CONSTRAINT "navigator_assignments_navigatorId_fkey" FOREIGN KEY ("navigatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_assignments" ADD CONSTRAINT "navigator_assignments_navigatorProfileId_fkey" FOREIGN KEY ("navigatorProfileId") REFERENCES "navigator_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_assignments" ADD CONSTRAINT "navigator_assignments_navigatorOrganisationId_fkey" FOREIGN KEY ("navigatorOrganisationId") REFERENCES "navigator_organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_handovers" ADD CONSTRAINT "navigator_handovers_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "navigator_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_handovers" ADD CONSTRAINT "navigator_handovers_fromNavigatorId_fkey" FOREIGN KEY ("fromNavigatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_handovers" ADD CONSTRAINT "navigator_handovers_toNavigatorId_fkey" FOREIGN KEY ("toNavigatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_outcomes" ADD CONSTRAINT "navigator_outcomes_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "navigator_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_feedback" ADD CONSTRAINT "navigator_feedback_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "navigator_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigator_feedback" ADD CONSTRAINT "navigator_feedback_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_relationship_records" ADD CONSTRAINT "service_relationship_records_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_relationship_records" ADD CONSTRAINT "service_relationship_records_providerOrganisationId_fkey" FOREIGN KEY ("providerOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_relationship_records" ADD CONSTRAINT "service_relationship_records_platformOrganisationId_fkey" FOREIGN KEY ("platformOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_role_disclosures" ADD CONSTRAINT "service_role_disclosures_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "service_relationship_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_relationship_snapshots" ADD CONSTRAINT "trust_relationship_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "service_relationship_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
