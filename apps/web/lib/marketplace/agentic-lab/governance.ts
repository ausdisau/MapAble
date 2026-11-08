/**
 * MapAble+ marketplace: deterministic, educational governance overlay.
 * Derived from public rights/ethics principles, not any regulatory approval.
 * This does NOT authenticate people, verify worker clearance, determine NDIS funding
 * or replace a qualified human decision-maker.
 */
export type GovernanceAction =
  | "read_public_guide"
  | "compare_synthetic_offers"
  | "prepare_synthetic_enquiry"
  | "share_personal_information"
  | "query_worker_clearance"
  | "claim_ndis_fundable"
  | "confirm_support_booking"
  | "create_product_order"
  | "agent_self_authorise_consent"
  | "infer_personal_capacity_from_disability"
  | "publish_automatic_worker_safety_score";
export type GovernanceActor = "participant" | "authorised_human_reviewer" | "participant_agent" | "provider_agent" | "worker_agent" | "supporter";
export type WorkerStatus = "Clearance" | "Pending" | "Interim bar" | "Exclusion" | "Suspension" | "No valid clearance" | "NOT_INDEPENDENTLY_VERIFIED";
export type GuardianDecision = "ALLOW_WITH_SAFEGUARDS" | "HOLD_BRANCH" | "ESCALATE" | "BLOCK_HARD_INVARIANT";
export type RightsAssessment = "protected" | "at_risk" | "unresolved";
export interface MarketGovernanceInput {
  readonly action: GovernanceAction;
  readonly actor: GovernanceActor;
  readonly participantChoseAction: boolean;
  readonly decisionSpecificCommunicationAccess: "supported" | "not_yet_attempted" | "unknown";
  readonly disclosureConsent: "explicit_local_demo" | "none" | "silence";
  readonly workerScreeningStatus: WorkerStatus;
  readonly workerStatusAuthorisedPortalEvidence: boolean;
  readonly providerRegistration: "NOT_INDEPENDENTLY_VERIFIED" | "OFFICIAL_REGISTER_MATCH";
  readonly itemKind: "care_support" | "low_cost_at";
}
export interface PublicGovernanceDecision {
  readonly decision: GuardianDecision;
  readonly action: GovernanceAction;
  readonly rightsStatus: RightsAssessment;
  readonly code: string;
  readonly rationale: string;
  readonly invariantRefs: readonly string[];
  readonly safeguards: readonly string[];
  readonly evidenceGaps: readonly string[];
  readonly humanReviewRequired: boolean;
  readonly executionAllowed: false;
  readonly workerScreening: {
    readonly field: "individual_ndis_worker_screening";
    readonly status: WorkerStatus;
    readonly independentlyVerified: boolean;
  };
  readonly providerRegistration: {
    readonly field: "ndis_provider_registration";
    readonly status: MarketGovernanceInput["providerRegistration"];
  };
  readonly ndisFundingClassification: "NOT_DETERMINED";
  readonly publicEvidenceSources: readonly string[];
}
const NDIS_GUIDE = "https://www.ndis.gov.au/participants/using-your-funding/understanding-your-ndis-funding/what-are-ndis-supports";
const SCREEN_GUIDE = "https://www.ndiscommission.gov.au/workforce/worker-screening";
const RIGHTS_REFERENCE = "Australian Disability Strategy and Disability Royal Commission supported decision-making principles; see source documentation for policy status";
function output(
  input: MarketGovernanceInput,
  decision: GuardianDecision, code: string, rationale: string,
  rightsStatus: RightsAssessment, invariantRefs: readonly string[],
  safeguards: readonly string[], evidenceGaps: readonly string[],
  humanReviewRequired: boolean,
): PublicGovernanceDecision {
  return {
    decision, code, action: input.action, rationale, rightsStatus,
    invariantRefs, safeguards, evidenceGaps, humanReviewRequired, executionAllowed: false,
    workerScreening: {
      field: "individual_ndis_worker_screening",
      status: input.workerStatusAuthorisedPortalEvidence ? input.workerScreeningStatus : "NOT_INDEPENDENTLY_VERIFIED",
      independentlyVerified: input.workerStatusAuthorisedPortalEvidence,
    },
    providerRegistration: { field: "ndis_provider_registration", status: input.providerRegistration },
    ndisFundingClassification: "NOT_DETERMINED",
    publicEvidenceSources: [NDIS_GUIDE, SCREEN_GUIDE, RIGHTS_REFERENCE],
  };
}
/**
 * Applies a graduated ethical review. Client-side checks are informative ONLY:
 * a real transaction needs server-side identity, consent and domain authorisation.
 * The status labels are independent, never combined to create a safety score.
 */
export function reviewMarketplaceGovernance(input: MarketGovernanceInput): PublicGovernanceDecision {
  const evidenceGaps = [
    "No person-specific NDIS plan, support-list classification or written replacement-support approval examined",
    "No independently authenticated participant, delegate, provider or worker identities in this demo",
    "No independent service capacity, worker competency or current product safety assessment",
  ];
  const safeguards = [
    "Use accessible communication including AAC, extra processing time and a non-AI human route",
    "Keep provider registration, individual worker screening and public enforcement records separate",
    "Record a purpose-specific human approval before any real disclosure or transaction",
    "Preserve missing evidence; enable correction, refusal, withdrawal and complaint review",
  ];
  if (input.action === "infer_personal_capacity_from_disability") {
    return output(input, "BLOCK_HARD_INVARIANT", "PERSONHOOD_NONDISCRIMINATION",
      "Diagnosis, support needs and communication difference cannot be used to infer reduced decision-making capacity.",
      "at_risk", ["Personhood", "Non-discrimination", "Communication access"], safeguards, evidenceGaps, true);
  }
  if (input.action === "agent_self_authorise_consent" ||
      input.action === "publish_automatic_worker_safety_score") {
    return output(input, "BLOCK_HARD_INVARIANT", "AUTHORITY_OR_EPISTEMIC_INTEGRITY",
      "An agent cannot manufacture participant consent or create a single worker safety/quality score from incomplete regulatory evidence.",
      "at_risk", ["Agency and consent", "No fabricated authority", "Epistemic honesty"], safeguards, evidenceGaps, true);
  }
  if (input.disclosureConsent === "silence" &&
      (input.action === "share_personal_information" || input.action === "confirm_support_booking" ||
       input.action === "create_product_order")) {
    return output(input, "BLOCK_HARD_INVARIANT", "SILENCE_IS_NOT_CONSENT",
      "Silence, AAC failure, delay or distress never creates consent for disclosure or a transaction.",
      "at_risk", ["Agency and consent", "Communication access"], safeguards, evidenceGaps, true);
  }
  if (input.action === "read_public_guide") {
    return output(input, "ALLOW_WITH_SAFEGUARDS", "PUBLIC_INFO_ONLY",
      "Public information can be shown locally without treating it as regulatory confirmation.",
      "protected", [], safeguards, evidenceGaps, false);
  }
  if (input.action === "compare_synthetic_offers") {
    return output(input, "ALLOW_WITH_SAFEGUARDS", "COMPLETE_SYNTHETIC_COMPARISON",
      "A fixed, unranked comparison of fictional offers is allowed. Selection and economic action remain human-led.",
      "protected", [], safeguards, evidenceGaps, false);
  }
  if (input.action === "prepare_synthetic_enquiry") {
    if (input.actor !== "participant" || !input.participantChoseAction) {
      return output(input, "HOLD_BRANCH", "PARTICIPANT_PREPARATION_MISSING",
        "The participant has not directly chosen this local drafting step.",
        "unresolved", ["Agency and consent"], safeguards, evidenceGaps, true);
    }
    return output(input, "ALLOW_WITH_SAFEGUARDS", "PREPARE_ONLY",
      "The participant may prepare a fictional draft. Nothing is sent or stored.",
      "protected", [], safeguards, evidenceGaps, false);
  }
  if (input.decisionSpecificCommunicationAccess !== "supported") {
    return output(input, "HOLD_BRANCH", "COMMUNICATION_ACCESS_UNRESOLVED",
      "Before consequential action, establish how the person wants to participate or communicate. Do not infer incapacity.",
      "unresolved", ["Communication access", "Agency and consent"], safeguards, evidenceGaps, true);
  }
  if (input.action === "query_worker_clearance") {
    return output(input, "HOLD_BRANCH", "AUTHORISED_PORTAL_REQUIRED",
      "Individual NDIS Worker Screening Check status must be obtained through authorised Commission/State-Territory evidence, not a public search or provider claim.",
      "unresolved", ["Epistemic honesty", "Privacy and purpose limitation"], safeguards,
      [...evidenceGaps, "Authorised NWSD evidence and lawful role are not established in this demo"], true);
  }
  if (input.action === "claim_ndis_fundable") {
    return output(input, "ESCALATE", "NDIS_SUPPORT_NEEDS_HUMAN_REVIEW",
      "An NDIS support category or catalogue line is not an individual funding decision. Current IN/OUT/replacement rules, plan wording and lawful approval must be reviewed.",
      "unresolved", ["Epistemic honesty", "No fabricated authority"], safeguards, evidenceGaps, true);
  }
  if (input.action === "share_personal_information") {
    return output(input, "HOLD_BRANCH", "NO_SERVER_CONSENT_RECEIPT",
      "A local demo choice is not a server-authorised consent receipt. Real disclosure requires verified purpose, recipient, identity, scope and expiry.",
      "unresolved", ["Privacy and purpose limitation", "Agency and consent"], safeguards, evidenceGaps, true);
  }
  if (input.action === "confirm_support_booking" || input.action === "create_product_order") {
    return output(input, "HOLD_BRANCH", "REAL_EXECUTION_DISABLED",
      "No authenticated provider/worker, finance, service agreement, product-safety or transaction authority is connected.",
      "unresolved", ["No fabricated authority", "Epistemic honesty"], safeguards, evidenceGaps, true);
  }
  // This branch is intentionally impossible for the declared action union.
  return output(input, "HOLD_BRANCH", "UNKNOWN", "Unrecognised action.", "unresolved", [], safeguards, evidenceGaps, true);
}
export const RESEARCH_GOVERNANCE_LEDGER = [
  {
    source: "PubMed",
    reference: "PMID:40170657",
    title: "AI-enabled AT Framework: a principles-based approach to emerging assistive technology",
    evidenceAccess: "ABSTRACT_INSPECTED",
    application: "User experience, privacy/security, quality, safety, value and human rights require separate evaluation.",
  },
  {
    source: "PubMed",
    reference: "PMID:41631749",
    title: "Adoption intentions and barriers to emerging technologies among people with disabilities",
    evidenceAccess: "ABSTRACT_INSPECTED",
    application: "Test affordability, accessibility, training and trust; no causal marketplace performance claim.",
  },
  {
    source: "JSTOR",
    reference: "https://www.jstor.org/stable/23723020",
    title: "Exploring the Relationships between Choice and Independence: Experiences of Disabled and Older People",
    evidenceAccess: "ABSTRACT_INSPECTED",
    application: "Choice and independence are multidimensional; do not optimize a universal participant-value score.",
  },
  {
    source: "Publisher",
    reference: "https://doi.org/10.1080/09687599.2023.2233684",
    title: "Unveiling algorithmic power: automated systems and disabled people's engagement with social services",
    evidenceAccess: "ABSTRACT_INSPECTED",
    application: "Watch for algorithmic categorisation, exclusion and epistemic injustice in service selection.",
  },
] as const;
