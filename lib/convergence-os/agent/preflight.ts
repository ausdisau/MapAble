import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PreflightRequest = {
  contractKey: string;
  objective: string;
  nonGoals?: string;
  canonicalModels?: string[];
  reusableServices?: string[];
  prohibitedConcepts?: string[];
  allowedPaths?: string[];
  protectedPaths?: string[];
  migrationsPermitted?: boolean;
  testsRequired?: string[];
  authorityCeiling?: string;
  releaseMode?: string;
  rollbackExpectation?: string;
  answers?: Record<string, string>;
};

export type StopCondition = {
  code: string;
  reason: string;
  escalate: boolean;
};

const DEFAULT_PROTECTED = [
  "prisma/schema.prisma",
  ".github/workflows/",
  "lib/billing-core/",
  "lib/config/convergence-os.ts",
];

/**
 * Build an Agent Implementation Contract before Cursor implements a major task.
 */
export function evaluateStopConditions(
  req: PreflightRequest
): StopCondition[] {
  const stops: StopCondition[] = [];
  const answers = req.answers ?? {};

  if (!answers.canonicalDomains || answers.canonicalDomains === "unclear") {
    stops.push({
      code: "unclear_ownership",
      reason: "Canonical domains / ownership unclear",
      escalate: true,
    });
  }
  if (answers.equivalentOpenPr === "yes") {
    stops.push({
      code: "equivalent_open_pr",
      reason: "Equivalent open PR already exists",
      escalate: true,
    });
  }
  if (answers.duplicateModel === "yes") {
    stops.push({
      code: "duplicate_model",
      reason: "Apparent duplicate canonical model",
      escalate: true,
    });
  }
  if (answers.migrationOrderUnresolved === "yes") {
    stops.push({
      code: "migration_order",
      reason: "Unresolved migration order",
      escalate: true,
    });
  }
  if (answers.authorityExpansion === "yes") {
    stops.push({
      code: "authority_expansion",
      reason: "AI or agent authority expansion requested (C-004)",
      escalate: true,
    });
  }
  if (answers.sensitivePathway === "yes") {
    stops.push({
      code: "sensitive_pathway",
      reason:
        "Physical/payment/claims/clinical/safeguarding introduction (C-020)",
      escalate: true,
    });
  }
  if (!req.rollbackExpectation) {
    stops.push({
      code: "no_rollback",
      reason: "No rollback expectation provided",
      escalate: true,
    });
  }
  if (answers.privacyClassUnclear === "yes") {
    stops.push({
      code: "privacy_unclear",
      reason: "Unclear privacy classification",
      escalate: true,
    });
  }
  if (answers.productionClaimChange === "yes") {
    stops.push({
      code: "claim_change",
      reason: "Production claim change requires human evidence review (C-025)",
      escalate: true,
    });
  }

  return stops;
}

export function renderContractMarkdown(contract: {
  contractKey: string;
  objective: string;
  nonGoals: string | null;
  canonicalModels: unknown;
  reusableServices: unknown;
  prohibitedConcepts: unknown;
  allowedPaths: unknown;
  protectedPaths: unknown;
  migrationsPermitted: boolean;
  testsRequired: unknown;
  authorityCeiling: string | null;
  releaseMode: string;
  rollbackExpectation: string | null;
  stopConditions: unknown;
  status: string;
}): string {
  return [
    `# Agent Implementation Contract: ${contract.contractKey}`,
    "",
    `**Status:** ${contract.status}`,
    `**Release mode:** ${contract.releaseMode}`,
    `**Migrations permitted:** ${contract.migrationsPermitted ? "yes (human review still required)" : "no"}`,
    `**Authority ceiling:** ${contract.authorityCeiling ?? "propose_only"}`,
    "",
    "## Objective",
    contract.objective,
    "",
    "## Non-goals",
    contract.nonGoals ?? "_(none listed)_",
    "",
    "## Canonical models",
    JSON.stringify(contract.canonicalModels ?? [], null, 2),
    "",
    "## Reuse",
    JSON.stringify(contract.reusableServices ?? [], null, 2),
    "",
    "## Prohibited new concepts",
    JSON.stringify(contract.prohibitedConcepts ?? [], null, 2),
    "",
    "## Allowed paths",
    JSON.stringify(contract.allowedPaths ?? [], null, 2),
    "",
    "## Protected paths",
    JSON.stringify(contract.protectedPaths ?? [], null, 2),
    "",
    "## Tests required",
    JSON.stringify(contract.testsRequired ?? [], null, 2),
    "",
    "## Rollback",
    contract.rollbackExpectation ?? "_(required)_",
    "",
    "## Stop / escalate conditions",
    JSON.stringify(contract.stopConditions ?? [], null, 2),
    "",
    "---",
    "AI may draft. Humans approve. GitHub/CI execute. No auto-merge.",
  ].join("\n");
}

export async function createAgentPreflightContract(
  req: PreflightRequest
): Promise<{
  id: string;
  status: string;
  stopConditions: StopCondition[];
  markdownExport: string;
}> {
  const stopConditions = evaluateStopConditions(req);
  const status = stopConditions.some((s) => s.escalate)
    ? "escalate"
    : "ready_for_human_review";

  const protectedPaths = [
    ...DEFAULT_PROTECTED,
    ...(req.protectedPaths ?? []),
  ];

  const markdownExport = renderContractMarkdown({
    contractKey: req.contractKey,
    objective: req.objective,
    nonGoals: req.nonGoals ?? null,
    canonicalModels: req.canonicalModels ?? [],
    reusableServices: req.reusableServices ?? [],
    prohibitedConcepts: req.prohibitedConcepts ?? [],
    allowedPaths: req.allowedPaths ?? [],
    protectedPaths,
    migrationsPermitted: Boolean(req.migrationsPermitted),
    testsRequired: req.testsRequired ?? [],
    authorityCeiling: req.authorityCeiling ?? "propose_only",
    releaseMode: req.releaseMode ?? "audit",
    rollbackExpectation: req.rollbackExpectation ?? null,
    stopConditions,
    status,
  });

  const row = await prisma.agentImplementationContract.upsert({
    where: { contractKey: req.contractKey },
    create: {
      contractKey: req.contractKey,
      objective: req.objective,
      nonGoals: req.nonGoals,
      canonicalModels: req.canonicalModels ?? [],
      reusableServices: req.reusableServices ?? [],
      prohibitedConcepts: req.prohibitedConcepts ?? [],
      allowedPaths: req.allowedPaths ?? [],
      protectedPaths,
      migrationsPermitted: Boolean(req.migrationsPermitted),
      testsRequired: req.testsRequired ?? [],
      authorityCeiling: req.authorityCeiling ?? "propose_only",
      releaseMode: req.releaseMode ?? "audit",
      rollbackExpectation: req.rollbackExpectation,
      stopConditions,
      status,
      markdownExport,
    },
    update: {
      objective: req.objective,
      nonGoals: req.nonGoals,
      canonicalModels: req.canonicalModels ?? [],
      reusableServices: req.reusableServices ?? [],
      prohibitedConcepts: req.prohibitedConcepts ?? [],
      allowedPaths: req.allowedPaths ?? [],
      protectedPaths,
      migrationsPermitted: Boolean(req.migrationsPermitted),
      testsRequired: req.testsRequired ?? [],
      authorityCeiling: req.authorityCeiling ?? "propose_only",
      releaseMode: req.releaseMode ?? "audit",
      rollbackExpectation: req.rollbackExpectation,
      stopConditions,
      status,
      markdownExport,
    },
  });

  return {
    id: row.id,
    status,
    stopConditions,
    markdownExport,
  };
}

export async function createPostImplementationReview(input: {
  contractKey: string;
  classification:
    | "expected"
    | "justified_deviation"
    | "undocumented_deviation"
    | "constitutional_violation";
  findings: Prisma.InputJsonValue;
}) {
  const contract = await prisma.agentImplementationContract.findUnique({
    where: { contractKey: input.contractKey },
  });
  if (!contract) throw new Error("Contract not found");

  return prisma.agentPostImplementationReview.create({
    data: {
      contractId: contract.id,
      classification: input.classification,
      findingsJson: input.findings,
    },
  });
}
