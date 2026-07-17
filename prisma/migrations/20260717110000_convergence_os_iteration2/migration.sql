-- CreateEnum
CREATE TYPE "ConstitutionRuleClass" AS ENUM ('constitutional_rule', 'architectural_preference', 'programme_convention', 'temporary_exception', 'experimental_rule', 'deprecated_rule');

-- CreateEnum
CREATE TYPE "ConstitutionExceptionStatus" AS ENUM ('draft', 'submitted', 'architecture_review', 'security_review', 'privacy_review', 'accessibility_review', 'approved', 'approved_with_conditions', 'rejected', 'expired', 'revoked', 'closed');

-- CreateEnum
CREATE TYPE "SemanticOverlapClass" AS ENUM ('identical_concept', 'overlapping_concept', 'extension', 'projection', 'legacy_alias', 'adapter', 'separate_concept', 'uncertain', 'human_review_required');

-- CreateEnum
CREATE TYPE "BlastRadiusSeverity" AS ENUM ('local', 'module', 'programme', 'cross_programme', 'platform', 'participant_authority', 'financial', 'safety_critical');

-- CreateEnum
CREATE TYPE "RehearsalStatus" AS ENUM ('pending', 'running', 'pass', 'blocked', 'human_review', 'failed');

-- CreateEnum
CREATE TYPE "DriftSeverity" AS ENUM ('info', 'warning', 'high', 'critical');

-- CreateEnum
CREATE TYPE "CompatibilityMatrixState" AS ENUM ('old_code_old_schema', 'old_code_new_schema', 'new_code_old_schema', 'new_code_new_schema');

-- CreateEnum
CREATE TYPE "CompatibilitySupportLevel" AS ENUM ('supported', 'temporarily_supported', 'unsupported', 'unknown', 'human_review_required');

-- AlterTable
ALTER TABLE "convergence_repository_snapshots" ADD COLUMN     "capabilityManifestHash" TEXT,
ADD COLUMN     "flagManifestHash" TEXT,
ADD COLUMN     "packageGraphHash" TEXT,
ADD COLUMN     "routeGraphHash" TEXT,
ADD COLUMN     "schemaHash" TEXT,
ADD COLUMN     "snapshotKind" TEXT NOT NULL DEFAULT 'main';

-- CreateTable
CREATE TABLE "convergence_twin_packages" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "path" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'workspace',
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_twin_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_twin_modules" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "programme" TEXT,
    "canonicalDomainKeys" JSONB,
    "description" TEXT,
    "writerCount" INTEGER NOT NULL DEFAULT 0,
    "routeCount" INTEGER NOT NULL DEFAULT 0,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_twin_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_twin_routes" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'ANY',
    "path" TEXT NOT NULL,
    "filePath" TEXT,
    "moduleKey" TEXT,
    "sideEffects" BOOLEAN NOT NULL DEFAULT false,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_twin_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_feature_flag_manifest" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "flagName" TEXT NOT NULL,
    "defaultValue" TEXT,
    "owner" TEXT,
    "purpose" TEXT,
    "sourceFile" TEXT,
    "category" TEXT,
    "retirementCondition" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_feature_flag_manifest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_repository_graph_edges" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "edgeType" TEXT NOT NULL,
    "fromNodeType" TEXT NOT NULL,
    "fromNodeKey" TEXT NOT NULL,
    "toNodeType" TEXT NOT NULL,
    "toNodeKey" TEXT NOT NULL,
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_repository_graph_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_architecture_constitutions" (
    "id" TEXT NOT NULL,
    "constitutionKey" TEXT NOT NULL DEFAULT 'mapable_architecture_constitution',
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convergence_architecture_constitutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_architecture_constitution_versions" (
    "id" TEXT NOT NULL,
    "constitutionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "summary" TEXT,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_architecture_constitution_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_architecture_rules" (
    "id" TEXT NOT NULL,
    "constitutionId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ruleClass" "ConstitutionRuleClass" NOT NULL DEFAULT 'constitutional_rule',
    "plainLanguage" TEXT NOT NULL,
    "rationale" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'high',
    "detectionMethod" TEXT,
    "owner" TEXT,
    "approver" TEXT,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewDate" TIMESTAMP(3),
    "supersededByKey" TEXT,
    "affectedDomains" JSONB,
    "affectedPaths" JSONB,
    "prohibitedPatterns" JSONB,
    "requiredConditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convergence_architecture_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_architecture_rule_exceptions" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "status" "ConstitutionExceptionStatus" NOT NULL DEFAULT 'draft',
    "businessReason" TEXT NOT NULL,
    "technicalReason" TEXT,
    "affectedCapability" TEXT,
    "affectedParticipants" TEXT,
    "durationDays" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "risk" TEXT,
    "compensatingControls" TEXT,
    "monitoring" TEXT,
    "rollback" TEXT,
    "removalPlan" TEXT,
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convergence_architecture_rule_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_architecture_rule_violations" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "evidence" TEXT,
    "affectedPaths" JSONB,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_architecture_rule_violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_semantic_overlap_candidates" (
    "id" TEXT NOT NULL,
    "candidateKey" TEXT NOT NULL,
    "leftName" TEXT NOT NULL,
    "rightName" TEXT NOT NULL,
    "leftPath" TEXT,
    "rightPath" TEXT,
    "classification" "SemanticOverlapClass" NOT NULL DEFAULT 'uncertain',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "unresolvedDifferences" TEXT,
    "recommendedReviewers" JSONB,
    "evidenceJson" JSONB,
    "humanDecision" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convergence_semantic_overlap_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_data_lineage_nodes" (
    "id" TEXT NOT NULL,
    "nodeKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dataClass" TEXT NOT NULL,
    "fieldPath" TEXT,
    "domainKey" TEXT,
    "synthetic" BOOLEAN NOT NULL DEFAULT true,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_data_lineage_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_data_lineage_edges" (
    "id" TEXT NOT NULL,
    "edgeKey" TEXT NOT NULL,
    "fromNodeKey" TEXT NOT NULL,
    "toNodeKey" TEXT NOT NULL,
    "transformation" TEXT,
    "policyRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_data_lineage_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_authority_chains" (
    "id" TEXT NOT NULL,
    "chainKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "participantSyntheticId" TEXT,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'complete',
    "gapFindingsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_authority_chains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_authority_chain_steps" (
    "id" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "stepType" TEXT NOT NULL,
    "actor" TEXT,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3),
    "outcome" TEXT,
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_authority_chain_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_blast_radius_simulations" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT,
    "simulationKey" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "changeSummary" TEXT NOT NULL,
    "severity" "BlastRadiusSeverity" NOT NULL DEFAULT 'module',
    "aiExplainedSeverity" "BlastRadiusSeverity",
    "finalSeverity" "BlastRadiusSeverity" NOT NULL,
    "rollbackDifficulty" TEXT,
    "impactsJson" JSONB,
    "counterfactual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_blast_radius_simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_rehearsal_runs" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT,
    "rehearsalKey" TEXT NOT NULL,
    "rehearsalType" TEXT NOT NULL,
    "status" "RehearsalStatus" NOT NULL DEFAULT 'pending',
    "trainKey" TEXT,
    "summary" TEXT,
    "mutatesRealBranches" BOOLEAN NOT NULL DEFAULT false,
    "stepsJson" JSONB,
    "compatibilityJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "convergence_rehearsal_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_agent_implementation_contracts" (
    "id" TEXT NOT NULL,
    "contractKey" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "nonGoals" TEXT,
    "canonicalModels" JSONB,
    "reusableServices" JSONB,
    "prohibitedConcepts" JSONB,
    "allowedPaths" JSONB,
    "protectedPaths" JSONB,
    "migrationsPermitted" BOOLEAN NOT NULL DEFAULT false,
    "testsRequired" JSONB,
    "authorityCeiling" TEXT,
    "releaseMode" TEXT NOT NULL DEFAULT 'audit',
    "rollbackExpectation" TEXT,
    "stopConditions" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "markdownExport" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convergence_agent_implementation_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_agent_post_implementation_reviews" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "findingsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_agent_post_implementation_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_drift_findings" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT,
    "findingKey" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "expectedState" TEXT,
    "observedState" TEXT,
    "severity" "DriftSeverity" NOT NULL DEFAULT 'warning',
    "owner" TEXT,
    "suggestedAction" TEXT,
    "deadline" TIMESTAMP(3),
    "evidenceJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_drift_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_environment_parity_records" (
    "id" TEXT NOT NULL,
    "environmentKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "appVersion" TEXT,
    "schemaVersion" TEXT,
    "featureFlagsJson" JSONB,
    "integrationsJson" JSONB,
    "secretsPresentJson" JSONB,
    "dataClassification" TEXT,
    "syntheticData" BOOLEAN NOT NULL DEFAULT true,
    "unsafeDifferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convergence_environment_parity_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_secret_contracts" (
    "id" TEXT NOT NULL,
    "secretName" TEXT NOT NULL,
    "owner" TEXT,
    "purpose" TEXT,
    "environmentsJson" JSONB,
    "expectedFormat" TEXT,
    "rotationPolicy" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "associatedIntegration" TEXT,
    "fallback" TEXT,
    "affectedCapability" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convergence_secret_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_supply_chain_dependencies" (
    "id" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "version" TEXT,
    "ecosystem" TEXT NOT NULL DEFAULT 'npm',
    "licence" TEXT,
    "purpose" TEXT,
    "owner" TEXT,
    "direct" BOOLEAN NOT NULL DEFAULT true,
    "affectedCapabilities" JSONB,
    "securityStatus" TEXT NOT NULL DEFAULT 'unknown',
    "upgradePolicy" TEXT,
    "replacementOption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convergence_supply_chain_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_ownership_records" (
    "id" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectKey" TEXT NOT NULL,
    "primaryOwner" TEXT,
    "secondaryOwner" TEXT,
    "reviewer" TEXT,
    "organisation" TEXT,
    "knowledgeLocation" TEXT,
    "successionState" TEXT NOT NULL DEFAULT 'ok',
    "lastReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convergence_ownership_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_ownership_gap_findings" (
    "id" TEXT NOT NULL,
    "findingKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subjectType" TEXT,
    "subjectKey" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_ownership_gap_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_architecture_fitness_functions" (
    "id" TEXT NOT NULL,
    "fitnessKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "advisoryOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_architecture_fitness_functions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_fitness_function_results" (
    "id" TEXT NOT NULL,
    "fitnessId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_fitness_function_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_golden_journeys" (
    "id" TEXT NOT NULL,
    "journeyKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "domainsJson" JSONB,
    "apisJson" JSONB,
    "modelsJson" JSONB,
    "flagsJson" JSONB,
    "rollbackNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_golden_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_golden_journey_steps" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "expectation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_golden_journey_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_federated_repositories" (
    "id" TEXT NOT NULL,
    "repoKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'related',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_federated_repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_federated_contracts" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "contractKey" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "version" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_federated_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_complexity_budget_snapshots" (
    "id" TEXT NOT NULL,
    "snapshotKey" TEXT NOT NULL,
    "dimensionsJson" JSONB NOT NULL,
    "breachesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convergence_complexity_budget_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convergence_runtime_components" (
    "id" TEXT NOT NULL,
    "componentKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "owner" TEXT,
    "region" TEXT,
    "dataClassification" TEXT,
    "healthCheck" TEXT,
    "fallback" TEXT,
    "deploymentVersion" TEXT,
    "credentialsPresent" BOOLEAN NOT NULL DEFAULT false,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convergence_runtime_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "convergence_twin_packages_snapshotId_idx" ON "convergence_twin_packages"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_twin_packages_snapshotId_name_key" ON "convergence_twin_packages"("snapshotId", "name");

-- CreateIndex
CREATE INDEX "convergence_twin_modules_snapshotId_idx" ON "convergence_twin_modules"("snapshotId");

-- CreateIndex
CREATE INDEX "convergence_twin_modules_path_idx" ON "convergence_twin_modules"("path");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_twin_modules_snapshotId_moduleKey_key" ON "convergence_twin_modules"("snapshotId", "moduleKey");

-- CreateIndex
CREATE INDEX "convergence_twin_routes_snapshotId_idx" ON "convergence_twin_routes"("snapshotId");

-- CreateIndex
CREATE INDEX "convergence_twin_routes_moduleKey_idx" ON "convergence_twin_routes"("moduleKey");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_twin_routes_snapshotId_method_path_key" ON "convergence_twin_routes"("snapshotId", "method", "path");

-- CreateIndex
CREATE INDEX "convergence_feature_flag_manifest_snapshotId_idx" ON "convergence_feature_flag_manifest"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_feature_flag_manifest_snapshotId_flagName_key" ON "convergence_feature_flag_manifest"("snapshotId", "flagName");

-- CreateIndex
CREATE INDEX "convergence_repository_graph_edges_snapshotId_idx" ON "convergence_repository_graph_edges"("snapshotId");

-- CreateIndex
CREATE INDEX "convergence_repository_graph_edges_edgeType_idx" ON "convergence_repository_graph_edges"("edgeType");

-- CreateIndex
CREATE INDEX "convergence_repository_graph_edges_fromNodeKey_idx" ON "convergence_repository_graph_edges"("fromNodeKey");

-- CreateIndex
CREATE INDEX "convergence_repository_graph_edges_toNodeKey_idx" ON "convergence_repository_graph_edges"("toNodeKey");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_architecture_constitutions_constitutionKey_key" ON "convergence_architecture_constitutions"("constitutionKey");

-- CreateIndex
CREATE INDEX "convergence_architecture_constitution_versions_constitution_idx" ON "convergence_architecture_constitution_versions"("constitutionId");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_architecture_constitution_versions_constitution_key" ON "convergence_architecture_constitution_versions"("constitutionId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_architecture_rules_ruleKey_key" ON "convergence_architecture_rules"("ruleKey");

-- CreateIndex
CREATE INDEX "convergence_architecture_rules_constitutionId_idx" ON "convergence_architecture_rules"("constitutionId");

-- CreateIndex
CREATE INDEX "convergence_architecture_rules_ruleClass_idx" ON "convergence_architecture_rules"("ruleClass");

-- CreateIndex
CREATE INDEX "convergence_architecture_rule_exceptions_ruleId_idx" ON "convergence_architecture_rule_exceptions"("ruleId");

-- CreateIndex
CREATE INDEX "convergence_architecture_rule_exceptions_status_idx" ON "convergence_architecture_rule_exceptions"("status");

-- CreateIndex
CREATE INDEX "convergence_architecture_rule_exceptions_expiresAt_idx" ON "convergence_architecture_rule_exceptions"("expiresAt");

-- CreateIndex
CREATE INDEX "convergence_architecture_rule_violations_ruleId_idx" ON "convergence_architecture_rule_violations"("ruleId");

-- CreateIndex
CREATE INDEX "convergence_architecture_rule_violations_status_idx" ON "convergence_architecture_rule_violations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_semantic_overlap_candidates_candidateKey_key" ON "convergence_semantic_overlap_candidates"("candidateKey");

-- CreateIndex
CREATE INDEX "convergence_semantic_overlap_candidates_classification_idx" ON "convergence_semantic_overlap_candidates"("classification");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_data_lineage_nodes_nodeKey_key" ON "convergence_data_lineage_nodes"("nodeKey");

-- CreateIndex
CREATE INDEX "convergence_data_lineage_nodes_dataClass_idx" ON "convergence_data_lineage_nodes"("dataClass");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_data_lineage_edges_edgeKey_key" ON "convergence_data_lineage_edges"("edgeKey");

-- CreateIndex
CREATE INDEX "convergence_data_lineage_edges_fromNodeKey_idx" ON "convergence_data_lineage_edges"("fromNodeKey");

-- CreateIndex
CREATE INDEX "convergence_data_lineage_edges_toNodeKey_idx" ON "convergence_data_lineage_edges"("toNodeKey");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_authority_chains_chainKey_key" ON "convergence_authority_chains"("chainKey");

-- CreateIndex
CREATE INDEX "convergence_authority_chain_steps_chainId_idx" ON "convergence_authority_chain_steps"("chainId");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_authority_chain_steps_chainId_stepOrder_key" ON "convergence_authority_chain_steps"("chainId", "stepOrder");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_blast_radius_simulations_simulationKey_key" ON "convergence_blast_radius_simulations"("simulationKey");

-- CreateIndex
CREATE INDEX "convergence_blast_radius_simulations_severity_idx" ON "convergence_blast_radius_simulations"("severity");

-- CreateIndex
CREATE INDEX "convergence_blast_radius_simulations_snapshotId_idx" ON "convergence_blast_radius_simulations"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_rehearsal_runs_rehearsalKey_key" ON "convergence_rehearsal_runs"("rehearsalKey");

-- CreateIndex
CREATE INDEX "convergence_rehearsal_runs_status_idx" ON "convergence_rehearsal_runs"("status");

-- CreateIndex
CREATE INDEX "convergence_rehearsal_runs_snapshotId_idx" ON "convergence_rehearsal_runs"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_agent_implementation_contracts_contractKey_key" ON "convergence_agent_implementation_contracts"("contractKey");

-- CreateIndex
CREATE INDEX "convergence_agent_implementation_contracts_status_idx" ON "convergence_agent_implementation_contracts"("status");

-- CreateIndex
CREATE INDEX "convergence_agent_post_implementation_reviews_contractId_idx" ON "convergence_agent_post_implementation_reviews"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_drift_findings_findingKey_key" ON "convergence_drift_findings"("findingKey");

-- CreateIndex
CREATE INDEX "convergence_drift_findings_layer_idx" ON "convergence_drift_findings"("layer");

-- CreateIndex
CREATE INDEX "convergence_drift_findings_severity_idx" ON "convergence_drift_findings"("severity");

-- CreateIndex
CREATE INDEX "convergence_drift_findings_snapshotId_idx" ON "convergence_drift_findings"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_environment_parity_records_environmentKey_key" ON "convergence_environment_parity_records"("environmentKey");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_secret_contracts_secretName_key" ON "convergence_secret_contracts"("secretName");

-- CreateIndex
CREATE INDEX "convergence_supply_chain_dependencies_ecosystem_idx" ON "convergence_supply_chain_dependencies"("ecosystem");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_supply_chain_dependencies_packageName_ecosystem_key" ON "convergence_supply_chain_dependencies"("packageName", "ecosystem");

-- CreateIndex
CREATE INDEX "convergence_ownership_records_successionState_idx" ON "convergence_ownership_records"("successionState");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_ownership_records_subjectType_subjectKey_key" ON "convergence_ownership_records"("subjectType", "subjectKey");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_ownership_gap_findings_findingKey_key" ON "convergence_ownership_gap_findings"("findingKey");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_architecture_fitness_functions_fitnessKey_key" ON "convergence_architecture_fitness_functions"("fitnessKey");

-- CreateIndex
CREATE INDEX "convergence_fitness_function_results_fitnessId_idx" ON "convergence_fitness_function_results"("fitnessId");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_golden_journeys_journeyKey_key" ON "convergence_golden_journeys"("journeyKey");

-- CreateIndex
CREATE INDEX "convergence_golden_journey_steps_journeyId_idx" ON "convergence_golden_journey_steps"("journeyId");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_golden_journey_steps_journeyId_stepOrder_key" ON "convergence_golden_journey_steps"("journeyId", "stepOrder");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_federated_repositories_repoKey_key" ON "convergence_federated_repositories"("repoKey");

-- CreateIndex
CREATE INDEX "convergence_federated_contracts_repoId_idx" ON "convergence_federated_contracts"("repoId");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_federated_contracts_repoId_contractKey_key" ON "convergence_federated_contracts"("repoId", "contractKey");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_complexity_budget_snapshots_snapshotKey_key" ON "convergence_complexity_budget_snapshots"("snapshotKey");

-- CreateIndex
CREATE UNIQUE INDEX "convergence_runtime_components_componentKey_key" ON "convergence_runtime_components"("componentKey");

-- CreateIndex
CREATE INDEX "convergence_runtime_components_environment_idx" ON "convergence_runtime_components"("environment");

-- CreateIndex
CREATE INDEX "convergence_repository_snapshots_snapshotKind_idx" ON "convergence_repository_snapshots"("snapshotKind");

-- AddForeignKey
ALTER TABLE "convergence_twin_packages" ADD CONSTRAINT "convergence_twin_packages_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "convergence_repository_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convergence_twin_modules" ADD CONSTRAINT "convergence_twin_modules_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "convergence_repository_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convergence_twin_routes" ADD CONSTRAINT "convergence_twin_routes_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "convergence_repository_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convergence_feature_flag_manifest" ADD CONSTRAINT "convergence_feature_flag_manifest_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "convergence_repository_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convergence_repository_graph_edges" ADD CONSTRAINT "convergence_repository_graph_edges_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "convergence_repository_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convergence_architecture_constitution_versions" ADD CONSTRAINT "convergence_architecture_constitution_versions_constitutio_fkey" FOREIGN KEY ("constitutionId") REFERENCES "convergence_architecture_constitutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convergence_architecture_rules" ADD CONSTRAINT "convergence_architecture_rules_constitutionId_fkey" FOREIGN KEY ("constitutionId") REFERENCES "convergence_architecture_constitutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convergence_architecture_rule_exceptions" ADD CONSTRAINT "convergence_architecture_rule_exceptions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "convergence_architecture_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convergence_architecture_rule_violations" ADD CONSTRAINT "convergence_architecture_rule_violations_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "convergence_architecture_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convergence_authority_chain_steps" ADD CONSTRAINT "convergence_authority_chain_steps_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "convergence_authority_chains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convergence_blast_radius_simulations" ADD CONSTRAINT "convergence_blast_radius_simulations_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "convergence_repository_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convergence_rehearsal_runs" ADD CONSTRAINT "convergence_rehearsal_runs_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "convergence_repository_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convergence_agent_post_implementation_reviews" ADD CONSTRAINT "convergence_agent_post_implementation_reviews_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "convergence_agent_implementation_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convergence_drift_findings" ADD CONSTRAINT "convergence_drift_findings_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "convergence_repository_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convergence_fitness_function_results" ADD CONSTRAINT "convergence_fitness_function_results_fitnessId_fkey" FOREIGN KEY ("fitnessId") REFERENCES "convergence_architecture_fitness_functions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convergence_golden_journey_steps" ADD CONSTRAINT "convergence_golden_journey_steps_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "convergence_golden_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convergence_federated_contracts" ADD CONSTRAINT "convergence_federated_contracts_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "convergence_federated_repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

