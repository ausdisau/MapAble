-- Y5 rights infrastructure schema extensions

-- AlterTable: ApiCertificationApplication
ALTER TABLE "ApiCertificationApplication" ADD COLUMN IF NOT EXISTS "certificationTier" TEXT;
ALTER TABLE "ApiCertificationApplication" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "ApiCertificationApplication" ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT;
ALTER TABLE "ApiCertificationApplication" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

-- AlterTable: CertifiedApiEcosystemEntry
ALTER TABLE "CertifiedApiEcosystemEntry" ADD COLUMN IF NOT EXISTS "linkedApplicationId" TEXT;
ALTER TABLE "CertifiedApiEcosystemEntry" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);
ALTER TABLE "CertifiedApiEcosystemEntry" ADD COLUMN IF NOT EXISTS "revokedReason" TEXT;

-- AlterTable: FederatedResearchAgreement
ALTER TABLE "FederatedResearchAgreement" ADD COLUMN IF NOT EXISTS "linkedSafeRoomProjectId" TEXT;
ALTER TABLE "FederatedResearchAgreement" ADD COLUMN IF NOT EXISTS "ethicsReviewNotes" TEXT;
ALTER TABLE "FederatedResearchAgreement" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "FederatedResearchAgreement" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- AlterTable: ResearchFederationNode
ALTER TABLE "ResearchFederationNode" ADD COLUMN IF NOT EXISTS "linkedAgreementId" TEXT;
ALTER TABLE "ResearchFederationNode" ADD COLUMN IF NOT EXISTS "scope" TEXT;
ALTER TABLE "ResearchFederationNode" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);

-- AlterTable: CommunityGovernanceMembership
ALTER TABLE "CommunityGovernanceMembership" ADD COLUMN IF NOT EXISTS "termEndsAt" TIMESTAMP(3);
ALTER TABLE "CommunityGovernanceMembership" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;

-- AlterTable: LongTermOutcomeSnapshot
ALTER TABLE "LongTermOutcomeSnapshot" ADD COLUMN IF NOT EXISTS "waveLabel" TEXT;
ALTER TABLE "LongTermOutcomeSnapshot" ADD COLUMN IF NOT EXISTS "cohortSize" INTEGER;
ALTER TABLE "LongTermOutcomeSnapshot" ADD COLUMN IF NOT EXISTS "measurementPeriodStart" TIMESTAMP(3);
ALTER TABLE "LongTermOutcomeSnapshot" ADD COLUMN IF NOT EXISTS "measurementPeriodEnd" TIMESTAMP(3);
ALTER TABLE "LongTermOutcomeSnapshot" ADD COLUMN IF NOT EXISTS "continuityMetricKey" TEXT;

-- AlterTable: FederatedAccountabilityPartner
ALTER TABLE "FederatedAccountabilityPartner" ADD COLUMN IF NOT EXISTS "linkedPublicationId" TEXT;
ALTER TABLE "FederatedAccountabilityPartner" ADD COLUMN IF NOT EXISTS "jurisdictionLabel" TEXT;

-- AlterTable: NationalAccountabilityPublication
ALTER TABLE "NationalAccountabilityPublication" ADD COLUMN IF NOT EXISTS "federatedPartnerId" TEXT;

-- AlterTable: InstitutionalContinuityCheckpoint
ALTER TABLE "InstitutionalContinuityCheckpoint" ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT;
ALTER TABLE "InstitutionalContinuityCheckpoint" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "InstitutionalContinuityCheckpoint" ADD COLUMN IF NOT EXISTS "reviewNotes" TEXT;
