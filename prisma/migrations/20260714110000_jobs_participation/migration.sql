-- CreateEnum
CREATE TYPE "EmploymentGoalStatus" AS ENUM ('active', 'achieved', 'paused', 'archived');
CREATE TYPE "EmploymentGoalCategory" AS ENUM ('skills_development', 'employment_type', 'hours_and_schedule', 'location_and_access', 'disclosure_and_support', 'other');
CREATE TYPE "AccessibilityEvidenceSource" AS ENUM ('audit', 'self_assessment', 'third_party_verification', 'participant_report', 'inspection');
CREATE TYPE "AccessibilityEvidenceStatus" AS ENUM ('pending', 'verified', 'expired', 'disputed');
CREATE TYPE "JobRequirementCategory" AS ENUM ('skill', 'experience', 'qualification', 'certification', 'access_need', 'schedule', 'location', 'transport', 'support', 'other');
CREATE TYPE "MatchRequirementStatus" AS ENUM ('matched', 'not_matched', 'unknown', 'participant_decision_required');
CREATE TYPE "DisclosurePreviewStatus" AS ENUM ('draft', 'previewed', 'confirmed');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "workplaceLocationId" TEXT;

-- CreateTable
CREATE TABLE "employment_profiles" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "preferredWorkTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "preferredHours" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "preferredLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "remotePreference" TEXT,
  "communicationPrefs" JSONB NOT NULL DEFAULT '{}',
  "adjustmentPrefs" JSONB NOT NULL DEFAULT '{}',
  "disclosureChoices" JSONB NOT NULL DEFAULT '{}',
  "transportDependency" BOOLEAN NOT NULL DEFAULT false,
  "supportDependency" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "employment_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employment_goals" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" "EmploymentGoalCategory" NOT NULL DEFAULT 'other',
  "targetDate" TIMESTAMP(3),
  "status" "EmploymentGoalStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "employment_goals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employer_accessibility_evidence" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "evidenceType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "source" "AccessibilityEvidenceSource" NOT NULL,
  "status" "AccessibilityEvidenceStatus" NOT NULL DEFAULT 'pending',
  "verifiedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "verifiedById" TEXT,
  "attachmentRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "employer_accessibility_evidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workplace_locations" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "suburb" TEXT,
  "state" TEXT,
  "postcode" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "workplace_locations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workplace_accessibility_evidence" (
  "id" TEXT NOT NULL,
  "workplaceLocationId" TEXT NOT NULL,
  "evidenceType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "source" "AccessibilityEvidenceSource" NOT NULL,
  "status" "AccessibilityEvidenceStatus" NOT NULL DEFAULT 'pending',
  "verifiedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "verifiedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "workplace_accessibility_evidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "job_requirements" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "category" "JobRequirementCategory" NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "isEssential" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_requirements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "job_match_explanations" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "requirementsMatched" JSONB NOT NULL DEFAULT '[]',
  "requirementsNotMatched" JSONB NOT NULL DEFAULT '[]',
  "adjustmentsAvailable" JSONB NOT NULL DEFAULT '[]',
  "adjustmentsUnknown" JSONB NOT NULL DEFAULT '[]',
  "locationAccess" JSONB NOT NULL DEFAULT '{}',
  "transportDependency" BOOLEAN,
  "supportDependency" BOOLEAN,
  "applicationDecisionRequired" BOOLEAN NOT NULL DEFAULT false,
  "explanationSummary" TEXT NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_match_explanations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "application_disclosure_previews" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "fieldsToDisclose" JSONB NOT NULL DEFAULT '{}',
  "fieldsWithheld" JSONB NOT NULL DEFAULT '{}',
  "employerVisible" JSONB NOT NULL DEFAULT '{}',
  "status" "DisclosurePreviewStatus" NOT NULL DEFAULT 'draft',
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "application_disclosure_previews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employment_profiles_participantId_key" ON "employment_profiles"("participantId");
CREATE INDEX "employment_goals_profileId_idx" ON "employment_goals"("profileId");
CREATE INDEX "employment_goals_participantId_status_idx" ON "employment_goals"("participantId", "status");
CREATE INDEX "employer_accessibility_evidence_organisationId_idx" ON "employer_accessibility_evidence"("organisationId");
CREATE INDEX "employer_accessibility_evidence_status_idx" ON "employer_accessibility_evidence"("status");
CREATE INDEX "workplace_locations_organisationId_idx" ON "workplace_locations"("organisationId");
CREATE INDEX "workplace_accessibility_evidence_workplaceLocationId_idx" ON "workplace_accessibility_evidence"("workplaceLocationId");
CREATE INDEX "workplace_accessibility_evidence_status_idx" ON "workplace_accessibility_evidence"("status");
CREATE INDEX "job_requirements_jobId_idx" ON "job_requirements"("jobId");
CREATE UNIQUE INDEX "job_match_explanations_jobId_participantId_key" ON "job_match_explanations"("jobId", "participantId");
CREATE INDEX "job_match_explanations_participantId_idx" ON "job_match_explanations"("participantId");
CREATE UNIQUE INDEX "application_disclosure_previews_applicationId_key" ON "application_disclosure_previews"("applicationId");
CREATE INDEX "application_disclosure_previews_participantId_idx" ON "application_disclosure_previews"("participantId");
CREATE INDEX "Job_workplaceLocationId_idx" ON "Job"("workplaceLocationId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_workplaceLocationId_fkey"
  FOREIGN KEY ("workplaceLocationId") REFERENCES "workplace_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employment_profiles" ADD CONSTRAINT "employment_profiles_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employment_goals" ADD CONSTRAINT "employment_goals_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "employment_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employment_goals" ADD CONSTRAINT "employment_goals_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employer_accessibility_evidence" ADD CONSTRAINT "employer_accessibility_evidence_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employer_accessibility_evidence" ADD CONSTRAINT "employer_accessibility_evidence_verifiedById_fkey"
  FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "workplace_locations" ADD CONSTRAINT "workplace_locations_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workplace_accessibility_evidence" ADD CONSTRAINT "workplace_accessibility_evidence_workplaceLocationId_fkey"
  FOREIGN KEY ("workplaceLocationId") REFERENCES "workplace_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workplace_accessibility_evidence" ADD CONSTRAINT "workplace_accessibility_evidence_verifiedById_fkey"
  FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "job_requirements" ADD CONSTRAINT "job_requirements_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "job_match_explanations" ADD CONSTRAINT "job_match_explanations_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_match_explanations" ADD CONSTRAINT "job_match_explanations_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "application_disclosure_previews" ADD CONSTRAINT "application_disclosure_previews_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_disclosure_previews" ADD CONSTRAINT "application_disclosure_previews_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
