CREATE TABLE "home_living_profiles" (
  "id" TEXT NOT NULL, "participantId" TEXT NOT NULL,
  "desiredLivingArrangements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "preferredLocations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "householdPreferences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "privacyPreferences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "accessibilityRequirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "communicationRequirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "personalSupportRequirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "overnightSupportRequirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "equipmentRequirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "environmentalRequirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "communityConnectionPreferences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "transportRequirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "dignityOfRiskChoices" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "nonNegotiables" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "informationSharingRules" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "home_living_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "home_living_profiles_participantId_key" ON "home_living_profiles"("participantId");
ALTER TABLE "home_living_profiles" ADD CONSTRAINT "home_living_profiles_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "accessible_properties" (
  "id" TEXT NOT NULL, "providerOrganisationId" TEXT NOT NULL, "title" TEXT NOT NULL,
  "addressSummary" TEXT NOT NULL, "propertyType" TEXT NOT NULL,
  "availabilityStatus" TEXT NOT NULL DEFAULT 'unknown', "availableFrom" TIMESTAMP(3),
  "tenancyTermsSummary" TEXT, "supportProviderIndependent" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3), CONSTRAINT "accessible_properties_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accessible_properties_providerOrganisationId_availabilityStatus_availableFrom_idx"
  ON "accessible_properties"("providerOrganisationId","availabilityStatus","availableFrom");
ALTER TABLE "accessible_properties" ADD CONSTRAINT "accessible_properties_providerOrganisationId_fkey"
  FOREIGN KEY ("providerOrganisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "property_accessibility_evidence" (
  "id" TEXT NOT NULL, "propertyId" TEXT NOT NULL, "feature" TEXT NOT NULL, "value" TEXT NOT NULL,
  "source" TEXT NOT NULL, "verificationStatus" TEXT NOT NULL, "observedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3), "disputedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "property_accessibility_evidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "property_accessibility_evidence_propertyId_feature_verificationStatus_idx"
  ON "property_accessibility_evidence"("propertyId","feature","verificationStatus");
CREATE INDEX "property_accessibility_evidence_expiresAt_idx" ON "property_accessibility_evidence"("expiresAt");
ALTER TABLE "property_accessibility_evidence" ADD CONSTRAINT "property_accessibility_evidence_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "accessible_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "participant_support_plans" (
  "id" TEXT NOT NULL, "participantId" TEXT NOT NULL, "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft', "currentVersion" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "participant_support_plans_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "participant_support_plans_participantId_status_idx"
  ON "participant_support_plans"("participantId","status");
ALTER TABLE "participant_support_plans" ADD CONSTRAINT "participant_support_plans_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "support_plan_versions" (
  "id" TEXT NOT NULL, "supportPlanId" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "authorUserId" TEXT NOT NULL, "authorAuthority" TEXT NOT NULL, "instructionsJson" JSONB NOT NULL,
  "limitations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "emergencyEscalation" TEXT,
  "effectiveAt" TIMESTAMP(3) NOT NULL, "reviewAt" TIMESTAMP(3), "supersededAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_plan_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "support_plan_versions_supportPlanId_version_key"
  ON "support_plan_versions"("supportPlanId","version");
CREATE INDEX "support_plan_versions_supportPlanId_effectiveAt_supersededAt_idx"
  ON "support_plan_versions"("supportPlanId","effectiveAt","supersededAt");
ALTER TABLE "support_plan_versions" ADD CONSTRAINT "support_plan_versions_supportPlanId_fkey"
  FOREIGN KEY ("supportPlanId") REFERENCES "participant_support_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "worker_competency_evidence" (
  "id" TEXT NOT NULL, "workerProfileId" TEXT NOT NULL, "competencyType" TEXT NOT NULL,
  "participantId" TEXT, "source" TEXT NOT NULL, "verificationStatus" TEXT NOT NULL,
  "verifiedByUserId" TEXT, "effectiveAt" TIMESTAMP(3) NOT NULL, "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3), "limitations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "worker_competency_evidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "worker_competency_evidence_workerProfileId_competencyType_verificationStatus_idx"
  ON "worker_competency_evidence"("workerProfileId","competencyType","verificationStatus");
CREATE INDEX "worker_competency_evidence_participantId_competencyType_idx"
  ON "worker_competency_evidence"("participantId","competencyType");
CREATE INDEX "worker_competency_evidence_expiresAt_revokedAt_idx"
  ON "worker_competency_evidence"("expiresAt","revokedAt");
ALTER TABLE "worker_competency_evidence" ADD CONSTRAINT "worker_competency_evidence_workerProfileId_fkey"
  FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "clinical_review_records" (
  "id" TEXT NOT NULL, "participantId" TEXT NOT NULL, "supportPlanId" TEXT,
  "reviewType" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'required',
  "assignedRole" TEXT NOT NULL, "reasonCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "dueAt" TIMESTAMP(3), "resolvedById" TEXT, "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "clinical_review_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "clinical_review_records_participantId_status_dueAt_idx"
  ON "clinical_review_records"("participantId","status","dueAt");
