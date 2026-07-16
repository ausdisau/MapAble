-- ConvergenceOS read-only governance registries (Wave 0+)
-- Additive only. No changes to Care/Transport/Access product tables.

CREATE TYPE "ConvergenceDomainStatus" AS ENUM (
  'canonical',
  'extension',
  'projection',
  'adapter',
  'read_model',
  'duplicate',
  'deprecated',
  'experimental',
  'fixture_only',
  'interim',
  'target'
);

CREATE TYPE "ConvergenceCapabilityMaturity" AS ENUM (
  'concept',
  'documented',
  'scaffolded',
  'fixture_only',
  'shadow',
  'pilot',
  'production_gated',
  'production_available',
  'deprecated',
  'retired'
);

CREATE TYPE "ConvergenceDependencyEdgeType" AS ENUM (
  'based_on',
  'depends_on',
  'supersedes',
  'duplicates',
  'conflicts_with',
  'extends',
  'blocks',
  'should_merge_before',
  'should_rebase_after',
  'makes_obsolete',
  'requires_migration',
  'requires_flag',
  'requires_manual_review'
);

CREATE TYPE "ConvergenceDecisionStatus" AS ENUM (
  'proposal',
  'approved',
  'rejected',
  'superseded'
);

CREATE TYPE "ConvergenceCollisionSeverity" AS ENUM (
  'info',
  'warning',
  'high',
  'critical'
);

CREATE TYPE "ConvergenceMergeTrainStatus" AS ENUM (
  'draft',
  'proposed',
  'accepted',
  'deferred',
  'superseded'
);

CREATE TABLE "convergence_repository_snapshots" (
  "id" TEXT NOT NULL,
  "baseBranch" TEXT NOT NULL DEFAULT 'main',
  "baseCommitSha" TEXT NOT NULL,
  "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source" TEXT NOT NULL DEFAULT 'fixture_pilot',
  "summaryJson" JSONB,
  "contentHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "convergence_repository_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "convergence_repository_snapshots_scannedAt_idx" ON "convergence_repository_snapshots"("scannedAt");
CREATE INDEX "convergence_repository_snapshots_baseCommitSha_idx" ON "convergence_repository_snapshots"("baseCommitSha");

CREATE TABLE "convergence_canonical_domains" (
  "id" TEXT NOT NULL,
  "domainKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "canonicalModel" TEXT,
  "canonicalService" TEXT,
  "canonicalApi" TEXT,
  "canonicalEventOwner" TEXT,
  "owningProgramme" TEXT,
  "authoritativePath" TEXT,
  "acceptedDecisionId" TEXT,
  "status" "ConvergenceDomainStatus" NOT NULL DEFAULT 'interim',
  "compatibilityAliases" JSONB,
  "duplicateImplementations" JSONB,
  "migrationState" TEXT,
  "deprecationState" TEXT,
  "reviewDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "convergence_canonical_domains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "convergence_canonical_domains_domainKey_key" ON "convergence_canonical_domains"("domainKey");
CREATE INDEX "convergence_canonical_domains_status_idx" ON "convergence_canonical_domains"("status");
CREATE INDEX "convergence_canonical_domains_owningProgramme_idx" ON "convergence_canonical_domains"("owningProgramme");

CREATE TABLE "convergence_canonical_domain_versions" (
  "id" TEXT NOT NULL,
  "domainId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "ConvergenceDomainStatus" NOT NULL,
  "canonicalModel" TEXT,
  "evidenceJson" JSONB,
  "changeSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "convergence_canonical_domain_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "convergence_canonical_domain_versions_domainId_version_key" ON "convergence_canonical_domain_versions"("domainId", "version");
CREATE INDEX "convergence_canonical_domain_versions_domainId_idx" ON "convergence_canonical_domain_versions"("domainId");

CREATE TABLE "convergence_repository_branches" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tipCommitSha" TEXT,
  "aheadOfMain" INTEGER,
  "behindMain" INTEGER,
  "mergeBaseSha" TEXT,
  "dropsIndoor" BOOLEAN NOT NULL DEFAULT false,
  "schemaChanged" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "convergence_repository_branches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "convergence_repository_branches_snapshotId_name_key" ON "convergence_repository_branches"("snapshotId", "name");
CREATE INDEX "convergence_repository_branches_snapshotId_idx" ON "convergence_repository_branches"("snapshotId");
CREATE INDEX "convergence_repository_branches_name_idx" ON "convergence_repository_branches"("name");

CREATE TABLE "convergence_repository_pull_requests" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "isDraft" BOOLEAN NOT NULL DEFAULT true,
  "baseBranch" TEXT NOT NULL,
  "headBranch" TEXT NOT NULL,
  "headBranchId" TEXT,
  "baseCommitSha" TEXT,
  "headCommitSha" TEXT,
  "mergeable" TEXT,
  "changedFiles" INTEGER,
  "additions" INTEGER,
  "deletions" INTEGER,
  "url" TEXT,
  "classLabel" TEXT,
  "collisionRisk" TEXT,
  "domainsAffected" JSONB,
  "prismaModelsAdded" JSONB,
  "migrationsAdded" JSONB,
  "featureFlagsAdded" JSONB,
  "knownLimitations" TEXT,
  "explicitNonGoals" TEXT,
  "recommendedMergeOrder" INTEGER,
  "warningLabels" JSONB,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "convergence_repository_pull_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "convergence_repository_pull_requests_snapshotId_number_key" ON "convergence_repository_pull_requests"("snapshotId", "number");
CREATE INDEX "convergence_repository_pull_requests_snapshotId_idx" ON "convergence_repository_pull_requests"("snapshotId");
CREATE INDEX "convergence_repository_pull_requests_number_idx" ON "convergence_repository_pull_requests"("number");
CREATE INDEX "convergence_repository_pull_requests_headBranch_idx" ON "convergence_repository_pull_requests"("headBranch");

CREATE TABLE "convergence_repository_dependencies" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "edgeType" "ConvergenceDependencyEdgeType" NOT NULL,
  "fromPrId" TEXT,
  "toPrId" TEXT,
  "fromRef" TEXT,
  "toRef" TEXT,
  "evidence" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "convergence_repository_dependencies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "convergence_repository_dependencies_snapshotId_idx" ON "convergence_repository_dependencies"("snapshotId");
CREATE INDEX "convergence_repository_dependencies_edgeType_idx" ON "convergence_repository_dependencies"("edgeType");
CREATE INDEX "convergence_repository_dependencies_fromPrId_idx" ON "convergence_repository_dependencies"("fromPrId");
CREATE INDEX "convergence_repository_dependencies_toPrId_idx" ON "convergence_repository_dependencies"("toPrId");

CREATE TABLE "convergence_platform_capabilities" (
  "id" TEXT NOT NULL,
  "capabilityKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "programme" TEXT,
  "userValue" TEXT,
  "canonicalOwner" TEXT,
  "implementationPaths" JSONB,
  "authorityLevel" TEXT,
  "readWrite" TEXT,
  "externalSideEffects" BOOLEAN NOT NULL DEFAULT false,
  "participantApprovalRequired" BOOLEAN NOT NULL DEFAULT false,
  "featureFlags" JSONB,
  "dataDomains" JSONB,
  "maturity" "ConvergenceCapabilityMaturity" NOT NULL DEFAULT 'concept',
  "persistenceType" TEXT,
  "runtimeMode" TEXT,
  "productionClaimStatus" TEXT,
  "rollbackNotes" TEXT,
  "owner" TEXT,
  "honestyJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "convergence_platform_capabilities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "convergence_platform_capabilities_capabilityKey_key" ON "convergence_platform_capabilities"("capabilityKey");
CREATE INDEX "convergence_platform_capabilities_maturity_idx" ON "convergence_platform_capabilities"("maturity");
CREATE INDEX "convergence_platform_capabilities_programme_idx" ON "convergence_platform_capabilities"("programme");

CREATE TABLE "convergence_architecture_decisions" (
  "id" TEXT NOT NULL,
  "decisionKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "decisionType" TEXT NOT NULL,
  "context" TEXT,
  "alternativesJson" JSONB,
  "selectedOption" TEXT,
  "rationale" TEXT,
  "evidenceJson" JSONB,
  "consequences" TEXT,
  "affectedPaths" JSONB,
  "affectedPrs" JSONB,
  "status" "ConvergenceDecisionStatus" NOT NULL DEFAULT 'proposal',
  "isAiProposal" BOOLEAN NOT NULL DEFAULT false,
  "owner" TEXT,
  "approver" TEXT,
  "decidedAt" TIMESTAMP(3),
  "reviewDate" TIMESTAMP(3),
  "supersededById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "convergence_architecture_decisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "convergence_architecture_decisions_decisionKey_key" ON "convergence_architecture_decisions"("decisionKey");
CREATE INDEX "convergence_architecture_decisions_status_idx" ON "convergence_architecture_decisions"("status");
CREATE INDEX "convergence_architecture_decisions_decisionType_idx" ON "convergence_architecture_decisions"("decisionType");

CREATE TABLE "convergence_schema_snapshots" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "refLabel" TEXT NOT NULL,
  "refName" TEXT NOT NULL,
  "modelCount" INTEGER NOT NULL,
  "modelNamesJson" JSONB NOT NULL,
  "migrationDirsJson" JSONB,
  "contentHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "convergence_schema_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "convergence_schema_snapshots_snapshotId_refLabel_key" ON "convergence_schema_snapshots"("snapshotId", "refLabel");
CREATE INDEX "convergence_schema_snapshots_snapshotId_idx" ON "convergence_schema_snapshots"("snapshotId");

CREATE TABLE "convergence_migration_collisions" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "collisionKey" TEXT NOT NULL,
  "severity" "ConvergenceCollisionSeverity" NOT NULL DEFAULT 'warning',
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "affectedModels" JSONB,
  "affectedBranches" JSONB,
  "exactDifference" TEXT,
  "semanticInterpretation" TEXT,
  "canonicalRecommendation" TEXT,
  "migrationStrategy" TEXT,
  "dataPreservationRisk" TEXT,
  "rollbackNotes" TEXT,
  "manualDecisionRequired" BOOLEAN NOT NULL DEFAULT true,
  "evidenceJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "convergence_migration_collisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "convergence_migration_collisions_snapshotId_collisionKey_key" ON "convergence_migration_collisions"("snapshotId", "collisionKey");
CREATE INDEX "convergence_migration_collisions_snapshotId_idx" ON "convergence_migration_collisions"("snapshotId");
CREATE INDEX "convergence_migration_collisions_severity_idx" ON "convergence_migration_collisions"("severity");
CREATE INDEX "convergence_migration_collisions_category_idx" ON "convergence_migration_collisions"("category");

CREATE TABLE "convergence_merge_trains" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "trainKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "trainType" TEXT NOT NULL,
  "status" "ConvergenceMergeTrainStatus" NOT NULL DEFAULT 'draft',
  "summary" TEXT,
  "riskSummary" TEXT,
  "rollbackNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "convergence_merge_trains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "convergence_merge_trains_snapshotId_trainKey_key" ON "convergence_merge_trains"("snapshotId", "trainKey");
CREATE INDEX "convergence_merge_trains_snapshotId_idx" ON "convergence_merge_trains"("snapshotId");
CREATE INDEX "convergence_merge_trains_status_idx" ON "convergence_merge_trains"("status");

CREATE TABLE "convergence_merge_train_steps" (
  "id" TEXT NOT NULL,
  "trainId" TEXT NOT NULL,
  "stepOrder" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "prNumber" INTEGER,
  "branchName" TEXT,
  "evidence" TEXT,
  "humanOwner" TEXT,
  "rollback" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "convergence_merge_train_steps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "convergence_merge_train_steps_trainId_stepOrder_key" ON "convergence_merge_train_steps"("trainId", "stepOrder");
CREATE INDEX "convergence_merge_train_steps_trainId_idx" ON "convergence_merge_train_steps"("trainId");

ALTER TABLE "convergence_canonical_domain_versions" ADD CONSTRAINT "convergence_canonical_domain_versions_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "convergence_canonical_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "convergence_repository_branches" ADD CONSTRAINT "convergence_repository_branches_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "convergence_repository_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "convergence_repository_pull_requests" ADD CONSTRAINT "convergence_repository_pull_requests_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "convergence_repository_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "convergence_repository_pull_requests" ADD CONSTRAINT "convergence_repository_pull_requests_headBranchId_fkey" FOREIGN KEY ("headBranchId") REFERENCES "convergence_repository_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "convergence_repository_dependencies" ADD CONSTRAINT "convergence_repository_dependencies_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "convergence_repository_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "convergence_repository_dependencies" ADD CONSTRAINT "convergence_repository_dependencies_fromPrId_fkey" FOREIGN KEY ("fromPrId") REFERENCES "convergence_repository_pull_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "convergence_repository_dependencies" ADD CONSTRAINT "convergence_repository_dependencies_toPrId_fkey" FOREIGN KEY ("toPrId") REFERENCES "convergence_repository_pull_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "convergence_schema_snapshots" ADD CONSTRAINT "convergence_schema_snapshots_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "convergence_repository_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "convergence_migration_collisions" ADD CONSTRAINT "convergence_migration_collisions_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "convergence_repository_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "convergence_merge_trains" ADD CONSTRAINT "convergence_merge_trains_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "convergence_repository_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "convergence_merge_train_steps" ADD CONSTRAINT "convergence_merge_train_steps_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "convergence_merge_trains"("id") ON DELETE CASCADE ON UPDATE CASCADE;
