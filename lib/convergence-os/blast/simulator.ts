import type { BlastRadiusSeverity } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type BlastSimulationInput = {
  simulationKey: string;
  changeType: string;
  changeSummary: string;
  counterfactual?: boolean;
  snapshotId?: string | null;
  /** Optional AI-explained severity — cannot lower final severity. */
  aiExplainedSeverity?: BlastRadiusSeverity;
  factors: {
    domainCount: number;
    writerCount: number;
    apiCount: number;
    sensitiveData: boolean;
    executionAuthority: boolean;
    migrationIrreversible: boolean;
    integrations: number;
    productionUse: boolean;
    rollbackAbility: "easy" | "moderate" | "hard" | "unknown";
    essentialWorkflow: boolean;
  };
};

const SEVERITY_RANK: BlastRadiusSeverity[] = [
  "local",
  "module",
  "programme",
  "cross_programme",
  "platform",
  "participant_authority",
  "financial",
  "safety_critical",
];

export function rankSeverity(s: BlastRadiusSeverity): number {
  return SEVERITY_RANK.indexOf(s);
}

export function maxSeverity(
  a: BlastRadiusSeverity,
  b: BlastRadiusSeverity
): BlastRadiusSeverity {
  return rankSeverity(a) >= rankSeverity(b) ? a : b;
}

/**
 * Deterministic blast-radius severity. AI may explain but cannot lower final.
 */
export function computeBlastSeverity(
  factors: BlastSimulationInput["factors"]
): BlastRadiusSeverity {
  let severity: BlastRadiusSeverity = "local";

  if (factors.writerCount > 0 || factors.apiCount > 3) severity = "module";
  if (factors.domainCount > 1) severity = "programme";
  if (factors.domainCount > 2 || factors.integrations > 2) {
    severity = "cross_programme";
  }
  if (factors.productionUse && factors.domainCount > 2) severity = "platform";
  if (factors.sensitiveData || factors.executionAuthority) {
    severity = maxSeverity(severity, "participant_authority");
  }
  if (factors.migrationIrreversible && factors.productionUse) {
    severity = maxSeverity(severity, "platform");
  }
  if (factors.essentialWorkflow && factors.sensitiveData) {
    severity = maxSeverity(severity, "participant_authority");
  }
  if (factors.rollbackAbility === "hard" && factors.productionUse) {
    severity = maxSeverity(severity, "platform");
  }

  return severity;
}

function inferFinancial(summary: string, changeType: string): boolean {
  const hay = `${summary} ${changeType}`.toLowerCase();
  return (
    hay.includes("invoice") ||
    hay.includes("payment") ||
    hay.includes("stripe") ||
    hay.includes("payout") ||
    hay.includes("ndis") ||
    hay.includes("billing")
  );
}

function inferSafety(summary: string, changeType: string): boolean {
  const hay = `${summary} ${changeType}`.toLowerCase();
  return (
    hay.includes("safeguard") ||
    hay.includes("clinical") ||
    hay.includes("incident") ||
    hay.includes("emergency")
  );
}

export function finalizeSeverity(input: {
  computed: BlastRadiusSeverity;
  aiExplained?: BlastRadiusSeverity;
  changeSummary: string;
  changeType: string;
}): { final: BlastRadiusSeverity; aiExplained?: BlastRadiusSeverity } {
  let final = input.computed;
  if (inferFinancial(input.changeSummary, input.changeType)) {
    final = maxSeverity(final, "financial");
  }
  if (inferSafety(input.changeSummary, input.changeType)) {
    final = maxSeverity(final, "safety_critical");
  }
  // AI may explain but cannot lower
  if (input.aiExplained) {
    final = maxSeverity(final, input.aiExplained);
  }
  return { final, aiExplained: input.aiExplained };
}

export const COUNTERFACTUAL_PRESETS: BlastSimulationInput[] = [
  {
    simulationKey: "cf_retire_transport_booking",
    changeType: "model_retirement",
    changeSummary: "What if TransportBooking is retired?",
    counterfactual: true,
    factors: {
      domainCount: 2,
      writerCount: 1,
      apiCount: 8,
      sensitiveData: false,
      executionAuthority: false,
      migrationIrreversible: true,
      integrations: 1,
      productionUse: true,
      rollbackAbility: "hard",
      essentialWorkflow: true,
    },
  },
  {
    simulationKey: "cf_consent_readonly",
    changeType: "authority_change",
    changeSummary: "What if ConsentRecord becomes read-only?",
    counterfactual: true,
    factors: {
      domainCount: 3,
      writerCount: 2,
      apiCount: 6,
      sensitiveData: true,
      executionAuthority: true,
      migrationIrreversible: false,
      integrations: 0,
      productionUse: true,
      rollbackAbility: "moderate",
      essentialWorkflow: true,
    },
  },
  {
    simulationKey: "cf_flag_defaults_true",
    changeType: "flag_default",
    changeSummary: "What if ConvergenceOS flags default to true?",
    counterfactual: true,
    factors: {
      domainCount: 1,
      writerCount: 0,
      apiCount: 12,
      sensitiveData: false,
      executionAuthority: false,
      migrationIrreversible: false,
      integrations: 0,
      productionUse: false,
      rollbackAbility: "easy",
      essentialWorkflow: false,
    },
  },
  {
    simulationKey: "cf_accessplace_org_tenancy",
    changeType: "schema_field",
    changeSummary: "What if AccessPlace gains organisation tenancy?",
    counterfactual: true,
    factors: {
      domainCount: 2,
      writerCount: 1,
      apiCount: 10,
      sensitiveData: false,
      executionAuthority: false,
      migrationIrreversible: true,
      integrations: 2,
      productionUse: true,
      rollbackAbility: "hard",
      essentialWorkflow: true,
    },
  },
  {
    simulationKey: "cf_careos_mission_canonical",
    changeType: "canonical_promotion",
    changeSummary: "What if CareOSMission becomes canonical mission SoR?",
    counterfactual: true,
    factors: {
      domainCount: 4,
      writerCount: 3,
      apiCount: 15,
      sensitiveData: true,
      executionAuthority: true,
      migrationIrreversible: true,
      integrations: 2,
      productionUse: true,
      rollbackAbility: "hard",
      essentialWorkflow: true,
    },
  },
  {
    simulationKey: "cf_disable_live_integration",
    changeType: "integration",
    changeSummary: "What if a live payment integration is disabled?",
    counterfactual: true,
    factors: {
      domainCount: 2,
      writerCount: 1,
      apiCount: 5,
      sensitiveData: true,
      executionAuthority: true,
      migrationIrreversible: false,
      integrations: 3,
      productionUse: true,
      rollbackAbility: "moderate",
      essentialWorkflow: true,
    },
  },
];

export async function runBlastSimulation(
  input: BlastSimulationInput
): Promise<{ id: string; finalSeverity: BlastRadiusSeverity }> {
  const computed = computeBlastSeverity(input.factors);
  const { final, aiExplained } = finalizeSeverity({
    computed,
    aiExplained: input.aiExplainedSeverity,
    changeSummary: input.changeSummary,
    changeType: input.changeType,
  });

  const impacts = {
    domains: input.factors.domainCount,
    writers: input.factors.writerCount,
    apis: input.factors.apiCount,
    integrations: input.factors.integrations,
    sensitiveData: input.factors.sensitiveData,
    rollbackAbility: input.factors.rollbackAbility,
    counterfactual: Boolean(input.counterfactual),
    note: "Advisory simulation — no source mutation",
  };

  const row = await prisma.blastRadiusSimulation.upsert({
    where: { simulationKey: input.simulationKey },
    create: {
      simulationKey: input.simulationKey,
      snapshotId: input.snapshotId ?? null,
      changeType: input.changeType,
      changeSummary: input.changeSummary,
      severity: computed,
      aiExplainedSeverity: aiExplained ?? null,
      finalSeverity: final,
      rollbackDifficulty: input.factors.rollbackAbility,
      impactsJson: impacts,
      counterfactual: Boolean(input.counterfactual),
    },
    update: {
      changeType: input.changeType,
      changeSummary: input.changeSummary,
      severity: computed,
      aiExplainedSeverity: aiExplained ?? null,
      finalSeverity: final,
      rollbackDifficulty: input.factors.rollbackAbility,
      impactsJson: impacts,
      counterfactual: Boolean(input.counterfactual),
      snapshotId: input.snapshotId ?? null,
    },
  });

  return { id: row.id, finalSeverity: final };
}

export async function seedCounterfactualSimulations(snapshotId?: string | null) {
  const results = [];
  for (const preset of COUNTERFACTUAL_PRESETS) {
    results.push(
      await runBlastSimulation({ ...preset, snapshotId: snapshotId ?? null })
    );
  }
  return results;
}
