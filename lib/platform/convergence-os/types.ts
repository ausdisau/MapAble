import type {
  ConvergenceCapabilityMaturity,
  ConvergenceCollisionSeverity,
  ConvergenceDependencyEdgeType,
  ConvergenceDomainStatus,
} from "@prisma/client";

export type DomainSeed = {
  domainKey: string;
  name: string;
  purpose: string;
  canonicalModel?: string;
  canonicalService?: string;
  canonicalApi?: string;
  canonicalEventOwner?: string;
  owningProgramme?: string;
  authoritativePath?: string;
  status: ConvergenceDomainStatus;
  compatibilityAliases?: string[];
  duplicateImplementations?: string[];
  migrationState?: string;
  deprecationState?: string;
  notes?: string;
};

export type CapabilitySeed = {
  capabilityKey: string;
  name: string;
  programme?: string;
  userValue?: string;
  canonicalOwner?: string;
  implementationPaths?: string[];
  authorityLevel?: string;
  readWrite?: "read" | "write" | "read_write";
  externalSideEffects?: boolean;
  participantApprovalRequired?: boolean;
  featureFlags?: string[];
  dataDomains?: string[];
  maturity: ConvergenceCapabilityMaturity;
  persistenceType?: string;
  runtimeMode?: string;
  productionClaimStatus?: string;
  rollbackNotes?: string;
  owner?: string;
  honesty: {
    implemented: boolean;
    featureEnabled: boolean;
    connected: boolean;
    durable: boolean;
    tested: boolean;
    piloted: boolean;
    externallyIntegrated: boolean;
    productionSupported: boolean;
  };
};

export type PilotPrSeed = {
  number: number;
  title: string;
  state: string;
  isDraft: boolean;
  baseBranch: string;
  headBranch: string;
  mergeable?: string;
  changedFiles?: number;
  additions?: number;
  deletions?: number;
  url?: string;
  classLabel?: string;
  collisionRisk?: string;
  domainsAffected?: string[];
  prismaModelsAdded?: string[];
  migrationsAdded?: string[];
  featureFlagsAdded?: string[];
  knownLimitations?: string;
  explicitNonGoals?: string;
  recommendedMergeOrder?: number;
  warningLabels?: string[];
  aheadOfMain?: number;
  behindMain?: number;
  dropsIndoor?: boolean;
  schemaChanged?: boolean;
};

export type PilotDependencySeed = {
  edgeType: ConvergenceDependencyEdgeType;
  fromPr: number;
  toPr: number;
  evidence: string;
};

export type DecisionProposalSeed = {
  decisionKey: string;
  title: string;
  decisionType: string;
  context: string;
  alternatives: string[];
  selectedOption: string;
  rationale: string;
  affectedPrs: number[];
  isAiProposal: boolean;
  owner?: string;
};

export type CollisionFinding = {
  collisionKey: string;
  severity: ConvergenceCollisionSeverity;
  category: string;
  title: string;
  affectedModels?: string[];
  affectedBranches?: string[];
  exactDifference?: string;
  semanticInterpretation?: string;
  canonicalRecommendation?: string;
  migrationStrategy?: string;
  dataPreservationRisk?: string;
  rollbackNotes?: string;
  manualDecisionRequired: boolean;
  evidenceJson?: Record<string, unknown>;
};

export type MergeTrainStepSeed = {
  stepOrder: number;
  action: string;
  prNumber?: number;
  branchName?: string;
  evidence?: string;
  humanOwner?: string;
  rollback?: string;
};

export type MergeTrainSeed = {
  trainKey: string;
  name: string;
  trainType: string;
  summary: string;
  riskSummary: string;
  rollbackNotes: string;
  steps: MergeTrainStepSeed[];
};

export type SchemaRefFixture = {
  refLabel: string;
  refName: string;
  modelNames: string[];
  migrationDirs: string[];
};
