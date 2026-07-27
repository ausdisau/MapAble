import { fingerprintToolCall } from "@/lib/aura-harness/fingerprint";
import { gammaCalculator } from "@/lib/aura-harness/gamma-calculator";
import {
  vectorMemoryStore,
  type MemoryMatch,
} from "@/lib/aura-harness/memory-store";
import {
  applyMitigationLayer,
  defaultMaskPiiStrategy,
  selectMitigationForTool,
} from "@/lib/aura-harness/mitigations";
import {
  policyActionReason,
  resolvePolicyAction,
} from "@/lib/aura-harness/policy-engine";
import {
  applyRecogniseToContexts,
  evaluateRecogniseContext,
} from "@/lib/aura-harness/recognise/pipeline";
import type { RecogniseEvaluation } from "@/lib/aura-harness/recognise/types";
import { extractSemanticScores } from "@/lib/aura-harness/semantic-judge";
import type {
  HarnessDecision,
  HarnessToolEvaluation,
  MitigationStrategy,
  PolicyAction,
} from "@/lib/aura-harness/types";

function toRecogniseAudit(recognise: RecogniseEvaluation): NonNullable<
  HarnessDecision["recognise"]
> {
  return {
    autonomy: { ...recognise.autonomy },
    accreditationTier: recognise.accreditation?.tier ?? null,
    evaluatorIds: [...recognise.evaluatorIds],
  };
}

function resolveWithAutonomy(
  matrixAction: PolicyAction,
  recognise: RecogniseEvaluation,
): { action: PolicyAction; reasonSuffix?: string } {
  // Systemic DENY wins; autonomy HITL escalates APPROVE/MITIGATE only.
  if (matrixAction === "DENY" || matrixAction === "REQUIRE_HITL") {
    return { action: matrixAction };
  }
  if (recognise.policyHint === "REQUIRE_HITL") {
    return {
      action: "REQUIRE_HITL",
      reasonSuffix: recognise.reason,
    };
  }
  return { action: matrixAction };
}

function blockedDecision(
  profile: ReturnType<typeof gammaCalculator.calculateProfile>,
  policyAction: HarnessDecision["policyAction"],
  reason: string,
  guardrailIds: string[],
  pendingHitl: boolean,
  recognise?: RecogniseEvaluation,
): HarnessDecision {
  return {
    outcome: pendingHitl ? "HITL_PENDING" : "DENIED",
    policyAction,
    profile: { ...profile, requiresHITL: pendingHitl },
    mitigation: pendingHitl
      ? {
          strategyId: "require_approval",
          actionType: "REQUIRE_APPROVAL",
        }
      : {
          strategyId: "block",
          actionType: "BLOCK",
        },
    reason,
    guardrailIds,
    recognise: recognise ? toRecogniseAudit(recognise) : undefined,
  };
}

async function scoreContexts(toolName: string, payload: unknown) {
  const baseContexts = extractSemanticScores(toolName, payload);
  const draftProfile = gammaCalculator.calculateProfile(baseContexts);
  const recognise = await evaluateRecogniseContext(
    toolName,
    payload,
    draftProfile,
  );
  const contexts = applyRecogniseToContexts(baseContexts, recognise);
  const profile = gammaCalculator.calculateProfile(contexts);
  // Recompute autonomy hint against final profile.
  const recogniseFinal = await evaluateRecogniseContext(
    toolName,
    payload,
    profile,
  );
  return { contexts, profile, recognise: recogniseFinal };
}

async function applyMitigatePath(
  toolName: string,
  payload: unknown,
  _profile: ReturnType<typeof gammaCalculator.calculateProfile>,
  mitigationHint: MitigationStrategy | null,
  recognise: RecogniseEvaluation,
): Promise<HarnessDecision> {
  const primary: MitigationStrategy =
    mitigationHint?.actionType === "MASK_PII"
      ? mitigationHint
      : defaultMaskPiiStrategy(toolName);

  let safeArgs = applyMitigationLayer(payload, primary);
  let effective = primary;
  let { contexts: rescoredContexts, profile: rescored, recognise: rescoredRec } =
    await scoreContexts(toolName, safeArgs);
  let rescoredPolicy = resolvePolicyAction(rescored);
  const resolved = resolveWithAutonomy(rescoredPolicy, rescoredRec);
  rescoredPolicy = resolved.action;

  if (rescoredPolicy !== "APPROVE" && rescored.highConcentration) {
    const reduce = selectMitigationForTool(toolName);
    const reduceStrategy: MitigationStrategy =
      reduce.actionType === "REDUCE_SCOPE"
        ? reduce
        : {
            strategyId: `reduce_scope:${toolName}`,
            actionType: "REDUCE_SCOPE",
          };
    safeArgs = applyMitigationLayer(safeArgs, reduceStrategy);
    effective = {
      strategyId: `${primary.strategyId}+${reduceStrategy.strategyId}`,
      actionType: "MASK_PII",
      targetFields: reduceStrategy.targetFields,
    };
    const again = await scoreContexts(toolName, safeArgs);
    rescoredContexts = again.contexts;
    rescored = again.profile;
    rescoredRec = again.recognise;
    rescoredPolicy = resolveWithAutonomy(
      resolvePolicyAction(rescored),
      rescoredRec,
    ).action;
  }

  if (rescoredPolicy === "APPROVE" || !rescored.highConcentration) {
    if (rescoredPolicy === "REQUIRE_HITL") {
      await vectorMemoryStore.commitAction(
        toolName,
        payload,
        rescored,
        effective,
        "DENIED",
        rescoredContexts[0]?.dimensions,
      );
      return blockedDecision(
        rescored,
        "REQUIRE_HITL",
        rescoredRec.reason ??
          "Autonomy criteria require HITL after mitigation.",
        ["aura:mitigate_autonomy_hitl", "aura:hitl"],
        true,
        rescoredRec,
      );
    }
    await vectorMemoryStore.commitAction(
      toolName,
      payload,
      rescored,
      effective,
      "MITIGATED",
      rescoredContexts[0]?.dimensions,
    );
    return {
      outcome: "MITIGATED",
      policyAction: "MITIGATE",
      profile: rescored,
      mitigation: effective,
      reason: `Mitigation ${effective.actionType} reduced concentration (C_conc=${rescored.concentrationCoeff.toFixed(1)}).`,
      guardrailIds: ["aura:mitigate", `aura:mitigate:${effective.actionType}`],
      safeArgs,
      recognise: toRecogniseAudit(recognise),
    };
  }

  await vectorMemoryStore.commitAction(
    toolName,
    payload,
    rescored,
    effective,
    "DENIED",
    rescoredContexts[0]?.dimensions,
  );
  return blockedDecision(
    rescored,
    "REQUIRE_HITL",
    `Mitigation insufficient; fail-closed HITL (C_conc=${rescored.concentrationCoeff.toFixed(1)}).`,
    ["aura:mitigate_failed", "aura:hitl"],
    true,
    rescoredRec,
  );
}

function fromMemoryMatch(
  match: MemoryMatch,
  payload: unknown,
): HarnessDecision | null {
  if (match.isExpired()) return null;

  if (match.isSafe && match.decision === "APPROVED") {
    return {
      outcome: "APPROVED",
      policyAction: "APPROVE",
      profile: {
        actionId: match.fingerprint,
        rawGamma: match.normalizedGamma,
        normalizedGamma: match.normalizedGamma,
        variance: 0,
        concentrationCoeff: match.concentrationCoeff,
        requiresHITL: false,
        highGamma: false,
        highConcentration: false,
      },
      mitigation: null,
      reason: "Memory precedent: historically safe.",
      guardrailIds: ["aura:memory:safe"],
      safeArgs: payload,
    };
  }

  if (match.isSafe && match.mitigation) {
    const safeArgs = applyMitigationLayer(payload, match.mitigation);
    return {
      outcome: "MITIGATED",
      policyAction: "MITIGATE",
      profile: {
        actionId: match.fingerprint,
        rawGamma: match.normalizedGamma,
        normalizedGamma: match.normalizedGamma,
        variance: 0,
        concentrationCoeff: match.concentrationCoeff,
        requiresHITL: false,
        highGamma: false,
        highConcentration: false,
      },
      mitigation: match.mitigation,
      reason: "Memory precedent: replaying successful mitigation.",
      guardrailIds: ["aura:memory:mitigation"],
      safeArgs,
    };
  }

  if (match.isDangerous) {
    return blockedDecision(
      {
        actionId: match.fingerprint,
        rawGamma: match.normalizedGamma,
        normalizedGamma: match.normalizedGamma,
        variance: 0,
        concentrationCoeff: match.concentrationCoeff,
        requiresHITL: match.decision === "HITL_REJECTED",
        highGamma: true,
        highConcentration: true,
      },
      match.decision === "HITL_REJECTED" ? "REQUIRE_HITL" : "DENY",
      "Memory precedent: historically dangerous; fail-closed.",
      ["aura:memory:dangerous"],
      match.decision === "HITL_REJECTED",
    );
  }

  return null;
}

/**
 * Full AURA evaluation pipeline for a single tools/call equivalent.
 */
export async function evaluateToolAction(
  toolName: string,
  payload: unknown,
): Promise<HarnessToolEvaluation> {
  const fingerprint = fingerprintToolCall(toolName, payload);

  const memoryMatch = await vectorMemoryStore.querySimilarAction(
    toolName,
    payload,
  );
  if (memoryMatch) {
    const fromMem = fromMemoryMatch(memoryMatch, payload);
    if (fromMem) {
      return { toolName, decision: fromMem, fingerprint };
    }
  }

  const { contexts, profile, recognise } = await scoreContexts(
    toolName,
    payload,
  );
  const matrixAction = resolvePolicyAction(profile);
  const resolved = resolveWithAutonomy(matrixAction, recognise);
  const policyAction = resolved.action;
  let reason = policyActionReason(
    policyAction === "REQUIRE_HITL" && matrixAction !== "REQUIRE_HITL"
      ? "REQUIRE_HITL"
      : matrixAction === policyAction
        ? policyAction
        : matrixAction,
    profile,
  );
  if (resolved.reasonSuffix) {
    reason = `${reason} ${resolved.reasonSuffix}`;
  }
  // Prefer matrix reason when actions match; when autonomy escalates, use its reason.
  if (
    matrixAction !== "REQUIRE_HITL" &&
    policyAction === "REQUIRE_HITL" &&
    recognise.reason
  ) {
    reason = recognise.reason;
  } else if (policyAction === matrixAction) {
    reason = policyActionReason(policyAction, profile);
  }

  const audit = toRecogniseAudit(recognise);

  if (policyAction === "APPROVE") {
    await vectorMemoryStore.commitAction(
      toolName,
      payload,
      profile,
      null,
      "APPROVED",
      contexts[0]?.dimensions,
    );
    return {
      toolName,
      fingerprint,
      decision: {
        outcome: "APPROVED",
        policyAction,
        profile,
        mitigation: null,
        reason,
        guardrailIds: ["aura:approve", "aura:recognise"],
        safeArgs: payload,
        recognise: audit,
      },
    };
  }

  if (policyAction === "MITIGATE") {
    const known = await vectorMemoryStore.findMitigation(toolName);
    const decision = await applyMitigatePath(
      toolName,
      payload,
      profile,
      known,
      recognise,
    );
    return { toolName, fingerprint, decision };
  }

  if (policyAction === "DENY") {
    await vectorMemoryStore.commitAction(
      toolName,
      payload,
      profile,
      null,
      "DENIED",
      contexts[0]?.dimensions,
    );
    return {
      toolName,
      fingerprint,
      decision: blockedDecision(
        profile,
        "DENY",
        reason,
        ["aura:deny", "aura:recognise"],
        false,
        recognise,
      ),
    };
  }

  await vectorMemoryStore.commitAction(
    toolName,
    payload,
    profile,
    null,
    "DENIED",
    contexts[0]?.dimensions,
  );
  return {
    toolName,
    fingerprint,
    decision: blockedDecision(
      profile,
      "REQUIRE_HITL",
      reason,
      ["aura:hitl", "aura:recognise"],
      true,
      recognise,
    ),
  };
}

export function buildAuraBlockedToolResult(
  decision: HarnessDecision,
  extras?: { handoffId?: string },
): {  aura: {
    blocked: true;
    pendingHumanReview?: boolean;
    reason: string;
    outcome: HarnessDecision["outcome"];
    handoffId?: string;    profile: {
      normalizedGamma: number;
      concentrationCoeff: number;
      variance: number;
    };
    recognise?: HarnessDecision["recognise"];
  };
} {
  return {
    aura: {
      blocked: true,
      pendingHumanReview: decision.outcome === "HITL_PENDING",
      reason: decision.reason,
      outcome: decision.outcome,
      handoffId: extras?.handoffId,      profile: {
        normalizedGamma: decision.profile.normalizedGamma,
        concentrationCoeff: decision.profile.concentrationCoeff,
        variance: decision.profile.variance,
      },
      recognise: decision.recognise,
    },
  };
}
