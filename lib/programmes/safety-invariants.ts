export type ProgrammeId =
  | "pathways"
  | "transition_home"
  | "kids"
  | "lifespan"
  | "home"
  | "at_lifecycle"
  | "work_retention"
  | "carer_continuity"
  | "regional_capacity"
  | "rights_navigator"
  | "integration_foundry"
  | "data_cooperative";

export const PROGRAMME_IDS: ProgrammeId[] = [
  "pathways",
  "transition_home",
  "kids",
  "lifespan",
  "home",
  "at_lifecycle",
  "work_retention",
  "carer_continuity",
  "regional_capacity",
  "rights_navigator",
  "integration_foundry",
  "data_cooperative",
];

export type ProgrammeInvariantId =
  | "participant_primary_decision_maker"
  | "explicit_authority_only"
  | "no_diagnosis_inference"
  | "no_capacity_inference"
  | "unknown_remains_unknown"
  | "no_legal_eligibility_decision"
  | "no_clinical_readiness_decision"
  | "no_funding_approval"
  | "no_payment_release"
  | "no_safeguarding_resolution"
  | "specific_disclosure"
  | "memory_not_consent"
  | "credential_not_consent"
  | "recommendation_not_determination"
  | "chat_not_only_workflow"
  | "essential_access_not_subscription_gated"
  | "paid_placement_no_trust_change"
  | "complaints_escalation_available"
  | "audit_correlation_required"
  | "feature_flag_required";

export type AuraProposalAction =
  | "explain"
  | "search"
  | "draft_question"
  | "draft_referral"
  | "draft_summary"
  | "prepare_checklist"
  | "compare_options";

export type ForbiddenAuraAction =
  | "decide_eligibility"
  | "approve_funding"
  | "release_payment"
  | "decide_clinical_readiness"
  | "resolve_safeguarding"
  | "infer_diagnosis"
  | "infer_capacity"
  | "send_without_approval";

export class ProgrammeInvariantError extends Error {
  constructor(
    public readonly invariantId: ProgrammeInvariantId,
    message: string,
  ) {
    super(message);
    this.name = "ProgrammeInvariantError";
  }
}

const FORBIDDEN_AURA_ACTIONS: ForbiddenAuraAction[] = [
  "decide_eligibility",
  "approve_funding",
  "release_payment",
  "decide_clinical_readiness",
  "resolve_safeguarding",
  "infer_diagnosis",
  "infer_capacity",
  "send_without_approval",
];

const DIAGNOSIS_INFERENCE_PATTERNS = [
  /\bdiagnos(e|is|ed)\b/i,
  /\bautism\b.*\beligib/i,
  /\bndis\s+eligible\b/i,
  /\bclinical\s+ready\b/i,
];

export function assertProgrammeInvariant(
  invariantId: ProgrammeInvariantId,
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    throw new ProgrammeInvariantError(invariantId, message);
  }
}

export function validateAuraProposalBoundary(input: {
  action: AuraProposalAction | ForbiddenAuraAction | string;
  requiresParticipantApproval?: boolean;
  textContent?: string;
}): void {
  if (FORBIDDEN_AURA_ACTIONS.includes(input.action as ForbiddenAuraAction)) {
    throw new ProgrammeInvariantError(
      "no_legal_eligibility_decision",
      `Forbidden AURA action: ${input.action}`,
    );
  }

  if (input.textContent) {
    for (const pattern of DIAGNOSIS_INFERENCE_PATTERNS) {
      if (pattern.test(input.textContent)) {
        throw new ProgrammeInvariantError(
          "no_diagnosis_inference",
          "AURA output must not infer diagnosis or eligibility",
        );
      }
    }
  }

  if (
    input.action === "draft_referral" &&
    input.requiresParticipantApproval !== true
  ) {
    throw new ProgrammeInvariantError(
      "explicit_authority_only",
      "Referrals require explicit participant approval",
    );
  }
}

export function assertDisclosureScope(input: {
  recipientId?: string;
  purpose?: string;
  fields?: string[];
  expiry?: Date | null;
}): void {
  assertProgrammeInvariant(
    "specific_disclosure",
    Boolean(input.recipientId && input.purpose && input.fields?.length),
    "Disclosure must specify recipient, purpose, and fields",
  );

  if (input.expiry && input.expiry.getTime() <= Date.now()) {
    throw new ProgrammeInvariantError(
      "specific_disclosure",
      "Disclosure expiry must be in the future",
    );
  }
}

export function assertUnknownPreserved(value: unknown): "known" | "unknown" {
  if (value === null || value === undefined || value === "") {
    return "unknown";
  }
  return "known";
}

export const PROGRAMME_INVARIANTS: Record<
  ProgrammeInvariantId,
  { summary: string }
> = {
  participant_primary_decision_maker: {
    summary: "The disabled person remains the primary decision-maker.",
  },
  explicit_authority_only: {
    summary:
      "Supporters assist only within explicit, scoped, revocable authority.",
  },
  no_diagnosis_inference: {
    summary: "Never infer access requirements from diagnosis.",
  },
  no_capacity_inference: {
    summary: "Never infer legal or cognitive capacity.",
  },
  unknown_remains_unknown: {
    summary: "Missing information remains unknown.",
  },
  no_legal_eligibility_decision: {
    summary: "A model cannot decide legal eligibility.",
  },
  no_clinical_readiness_decision: {
    summary: "A model cannot decide clinical readiness.",
  },
  no_funding_approval: {
    summary: "A model cannot approve funding.",
  },
  no_payment_release: {
    summary: "A model cannot release payment.",
  },
  no_safeguarding_resolution: {
    summary: "A model cannot resolve safeguarding matters.",
  },
  specific_disclosure: {
    summary:
      "Every disclosure is recipient, purpose, field and expiry specific.",
  },
  memory_not_consent: {
    summary: "Durable memory is not consent.",
  },
  credential_not_consent: {
    summary: "A credential is not consent.",
  },
  recommendation_not_determination: {
    summary: "A recommendation is not a legal or professional determination.",
  },
  chat_not_only_workflow: {
    summary: "Chat is never the only workflow.",
  },
  essential_access_not_subscription_gated: {
    summary:
      "Essential access and safety information must not depend on a paid subscription.",
  },
  paid_placement_no_trust_change: {
    summary:
      "Paid placement must not change trust, evidence, reliability or moderation.",
  },
  complaints_escalation_available: {
    summary:
      "Complaints, corrections and human escalation must remain available.",
  },
  audit_correlation_required: {
    summary: "All programme actions emit correlated audit events.",
  },
  feature_flag_required: {
    summary:
      "Every risky capability is controlled by a server-side feature flag.",
  },
};
