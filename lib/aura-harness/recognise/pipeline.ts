import { evaluateAccreditationBridge } from "@/lib/aura-harness/recognise/accreditation-bridge";
import {
  DEFAULT_AUTONOMY_EVALUATORS,
  mergeAutonomyScores,
} from "@/lib/aura-harness/recognise/autonomy-criteria";
import { autonomyPolicyHint } from "@/lib/aura-harness/recognise/autonomy-policy";
import {
  listRiskCriterionEvaluators,
  registerRiskCriterionEvaluator,
} from "@/lib/aura-harness/recognise/evaluator-registry";
import type { RecogniseEvaluation } from "@/lib/aura-harness/recognise/types";
import type { ActionContext, AuraRiskProfile } from "@/lib/aura-harness/types";

let defaultsRegistered = false;

export function ensureDefaultAutonomyEvaluators(): void {
  if (defaultsRegistered) return;
  for (const evaluator of DEFAULT_AUTONOMY_EVALUATORS) {
    registerRiskCriterionEvaluator(evaluator);
  }
  defaultsRegistered = true;
}

/** Test helper — allows re-registering defaults after registry reset. */
export function __resetDefaultAutonomyRegistrationForTests(): void {
  defaultsRegistered = false;
}

/**
 * Recognise pipeline: autonomy criteria evaluators + optional accreditation bridge.
 */
export async function evaluateRecogniseContext(
  toolName: string,
  payload: unknown,
  profile?: AuraRiskProfile,
): Promise<RecogniseEvaluation> {
  ensureDefaultAutonomyEvaluators();
  const evaluators = listRiskCriterionEvaluators();
  const parts = await Promise.all(
    evaluators.map((e) => e.evaluate({ toolName, payload })),
  );
  const autonomy = mergeAutonomyScores(parts);
  const accreditation = evaluateAccreditationBridge(payload);

  let policyHint = null as RecogniseEvaluation["policyHint"];
  let reason: string | undefined;
  if (profile) {
    const hint = autonomyPolicyHint(autonomy, profile);
    policyHint = hint.policyHint;
    reason = hint.reason;
  }

  return {
    autonomy,
    accreditation,
    evaluatorIds: evaluators.map((e) => e.id),
    policyHint,
    reason,
  };
}

/** Fold Recognise scores into action-context dimensions for gamma math. */
export function applyRecogniseToContexts(
  contexts: ActionContext[],
  recognise: RecogniseEvaluation,
): ActionContext[] {
  return contexts.map((ctx) => ({
    ...ctx,
    dimensions: ctx.dimensions.map((dim) => {
      if (dim.id === "capability_dependence") {
        return { ...dim, score: recognise.autonomy.capabilityDependence };
      }
      if (dim.id === "irreversibility") {
        return { ...dim, score: recognise.autonomy.irreversibility };
      }
      if (dim.id === "cascading_impact") {
        return { ...dim, score: recognise.autonomy.cascadingImpact };
      }
      if (
        dim.id === "accessibility_representation" &&
        recognise.accreditation
      ) {
        return {
          ...dim,
          score: Math.max(
            dim.score,
            recognise.accreditation.accessibilityRiskScore,
          ),
        };
      }
      return dim;
    }),
  }));
}
