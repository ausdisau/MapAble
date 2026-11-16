-- Capability Passport v1 workflow overlay.
-- IMPORTANT: reviewed, preview-only migration. Never run automatically on production.
-- Stacks after 20261117000000_relational_fit_worker_opt_in.
-- Rollback: restore the preview branch, or `prisma migrate resolve --rolled-back 20261117120000_capability_passport_v1`
-- then DROP the tables and enum types below. Do not apply to production Neon.

CREATE TYPE "OfficialNdisScreeningOutcome" AS ENUM (
    'clearance',
    'pending',
    'interim_bar',
    'exclusion',
    'suspension',
    'no_valid_clearance',
    'not_independently_verified'
);

CREATE TYPE "CapabilityReviewKind" AS ENUM (
    'screening_verification',
    'credential_discrepancy',
    'competency_assessment',
    'refresher',
    'revocation',
    'participant_preparation',
    'dispute'
);

CREATE TYPE "CapabilityReviewDecision" AS ENUM (
    'hold',
    'request_evidence',
    'refer_for_assessment',
    'escalate',
    'approve',
    'reject'
);

CREATE TABLE "worker_screening_records" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "officialOutcome" "OfficialNdisScreeningOutcome" NOT NULL DEFAULT 'not_independently_verified',
    "expiresAt" TIMESTAMP(3),
    "eligibleToWork" BOOLEAN,
    "identityLinked" BOOLEAN NOT NULL DEFAULT false,
    "verifyingOrganisationId" TEXT,
    "authorisedReviewerUserId" TEXT,
    "source" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "worker_screening_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "worker_screening_records_workerProfileId_officialOutcome_idx"
    ON "worker_screening_records" ("workerProfileId", "officialOutcome");
CREATE INDEX "worker_screening_records_expiresAt_idx"
    ON "worker_screening_records" ("expiresAt");

ALTER TABLE "worker_screening_records"
    ADD CONSTRAINT "worker_screening_records_workerProfileId_fkey"
    FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "capability_review_cases" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "kind" "CapabilityReviewKind" NOT NULL,
    "evidenceIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "scope" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL DEFAULT 'capability-passport-v1',
    "participantId" TEXT,
    "decision" "CapabilityReviewDecision" NOT NULL DEFAULT 'hold',
    "decisionReason" TEXT,
    "accountableHumanUserId" TEXT,
    "limitations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "legalProhibition" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "capability_review_cases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "capability_review_cases_workerProfileId_status_idx"
    ON "capability_review_cases" ("workerProfileId", "status");
CREATE INDEX "capability_review_cases_organisationId_kind_status_idx"
    ON "capability_review_cases" ("organisationId", "kind", "status");
CREATE INDEX "capability_review_cases_participantId_idx"
    ON "capability_review_cases" ("participantId");

ALTER TABLE "capability_review_cases"
    ADD CONSTRAINT "capability_review_cases_workerProfileId_fkey"
    FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "worker_evidence_disputes" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "evidenceKind" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "worker_evidence_disputes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "worker_evidence_disputes_workerProfileId_status_idx"
    ON "worker_evidence_disputes" ("workerProfileId", "status");
CREATE INDEX "worker_evidence_disputes_evidenceKind_evidenceId_idx"
    ON "worker_evidence_disputes" ("evidenceKind", "evidenceId");

ALTER TABLE "worker_evidence_disputes"
    ADD CONSTRAINT "worker_evidence_disputes_workerProfileId_fkey"
    FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "worker_passport_share_preferences" (
    "workerProfileId" TEXT NOT NULL,
    "shareWithProviders" BOOLEAN NOT NULL DEFAULT false,
    "shareWithParticipants" BOOLEAN NOT NULL DEFAULT false,
    "shareScreeningSummary" BOOLEAN NOT NULL DEFAULT false,
    "shareQualifications" BOOLEAN NOT NULL DEFAULT false,
    "shareTraining" BOOLEAN NOT NULL DEFAULT false,
    "shareCompetencies" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "worker_passport_share_preferences_pkey" PRIMARY KEY ("workerProfileId")
);

ALTER TABLE "worker_passport_share_preferences"
    ADD CONSTRAINT "worker_passport_share_preferences_workerProfileId_fkey"
    FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
