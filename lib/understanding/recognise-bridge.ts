import { isAuraHarnessEnabled } from "@/lib/aura-harness/config";
import { registerRiskCriterionEvaluator } from "@/lib/aura-harness/recognise/evaluator-registry";
import { isUnderstandingEnabled } from "@/lib/config/understanding";
import { getLivingArrangementRiskSignal } from "@/lib/understanding/relationship-risk-service";

let registered = false;

/**
 * Optional plug: elevated living-arrangement signal → cascading_impact for AURA.
 * Only registers when both Understanding and AURA harness flags are on.
 */
export function ensureUnderstandingRecogniseBridge(): void {
  if (registered) return;
  if (!isUnderstandingEnabled() || !isAuraHarnessEnabled()) return;

  registerRiskCriterionEvaluator({
    id: "understanding.living_arrangement_cascade",
    async evaluate({ payload }) {
      const participantId =
        payload &&
        typeof payload === "object" &&
        "participantId" in payload &&
        typeof (payload as { participantId: unknown }).participantId ===
          "string"
          ? (payload as { participantId: string }).participantId
          : null;
      if (!participantId) return {};
      try {
        const signal = await getLivingArrangementRiskSignal(participantId);
        if (!signal) return {};
        if (signal.riskLevel === "high") {
          return { cascadingImpact: Math.max(80, signal.score) };
        }
        if (signal.riskLevel === "moderate") {
          return { cascadingImpact: Math.max(55, signal.score) };
        }
      } catch {
        return {};
      }
      return {};
    },
  });
  registered = true;
}

export function __resetUnderstandingRecogniseBridgeForTests(): void {
  registered = false;
}
