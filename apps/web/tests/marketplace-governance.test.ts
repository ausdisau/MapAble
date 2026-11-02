import { describe, expect, it } from "vitest";

import {
  reviewMarketplaceGovernance,
  RESEARCH_GOVERNANCE_LEDGER,
  type GovernanceAction,
  type GovernanceActor,
  type MarketGovernanceInput,
} from "@/lib/marketplace/agentic-lab/governance";

const baseline: MarketGovernanceInput = {
  action: "compare_synthetic_offers",
  actor: "participant",
  participantChoseAction: true,
  decisionSpecificCommunicationAccess: "supported",
  disclosureConsent: "explicit_local_demo",
  workerScreeningStatus: "Clearance",
  workerStatusAuthorisedPortalEvidence: false,
  providerRegistration: "OFFICIAL_REGISTER_MATCH",
  itemKind: "care_support",
};
function review(action: GovernanceAction, overrides: Partial<MarketGovernanceInput> = {}) {
  return reviewMarketplaceGovernance({ ...baseline, action, ...overrides });
}
describe("NDIS Advisor, worker screening, person-centred rights and Sovereign Ethical Guardian boundaries", () => {
  it("treats synthetic read/compare as local-only with no execution", () => {
    for (const action of ["read_public_guide", "compare_synthetic_offers"] as const) {
      const result = review(action);
      expect(result.decision).toBe("ALLOW_WITH_SAFEGUARDS");
      expect(result.executionAllowed).toBe(false);
      expect(result.ndisFundingClassification).toBe("NOT_DETERMINED");
      expect(result.safeguards.some((x) => x.includes("AAC"))).toBe(true);
    }
  });
  it("keeps provider registration separate from worker clearance", () => {
    const result = review("query_worker_clearance", {
      workerScreeningStatus: "Clearance",
      workerStatusAuthorisedPortalEvidence: false,
      providerRegistration: "OFFICIAL_REGISTER_MATCH",
    });
    expect(result.workerScreening.status).toBe("NOT_INDEPENDENTLY_VERIFIED");
    expect(result.workerScreening.independentlyVerified).toBe(false);
    expect(result.providerRegistration.status).toBe("OFFICIAL_REGISTER_MATCH");
    expect(result.decision).toBe("HOLD_BRANCH");
  });
  it.each([
    "Pending", "Interim bar", "Exclusion", "Suspension", "No valid clearance",
  ] as const)("preserves distinct official worker screening status %s", (workerScreeningStatus) => {
    const result = review("query_worker_clearance", {
      workerScreeningStatus,
      workerStatusAuthorisedPortalEvidence: true,
    });
    expect(result.workerScreening.status).toBe(workerScreeningStatus);
    expect(result.decision).toBe("HOLD_BRANCH");
  });
  it("does not allow clearance to imply competence or live booking authority", () => {
    const result = review("confirm_support_booking", {
      workerScreeningStatus: "Clearance", workerStatusAuthorisedPortalEvidence: true,
    });
    expect(result.decision).toBe("HOLD_BRANCH");
    expect(result.executionAllowed).toBe(false);
  });
  it("never determines an individual NDIS funding entitlement", () => {
    const result = review("claim_ndis_fundable");
    expect(result.decision).toBe("ESCALATE");
    expect(result.ndisFundingClassification).toBe("NOT_DETERMINED");
  });
  it.each(["provider_agent","worker_agent","supporter","participant_agent"] as const)(
    "cannot self-authorise participant action as %s", (actor: GovernanceActor) => {
      const result = review("agent_self_authorise_consent", {actor});
      expect(result.decision).toBe("BLOCK_HARD_INVARIANT");
      expect(result.invariantRefs).toContain("Agency and consent");
    }
  );
  it("refuses inferred incapacity from diagnosis or AAC", () => {
    const result = review("infer_personal_capacity_from_disability");
    expect(result.decision).toBe("BLOCK_HARD_INVARIANT");
    expect(result.invariantRefs).toContain("Non-discrimination");
  });
  it("never uses silence as consent for private data disclosure", () => {
    const result = review("share_personal_information", {disclosureConsent:"silence"});
    expect(result.code).toBe("SILENCE_IS_NOT_CONSENT");
    expect(result.decision).toBe("BLOCK_HARD_INVARIANT");
  });
  it("does not mistake a local demo click for live disclosure approval", () => {
    const result = review("share_personal_information");
    expect(result.code).toBe("NO_SERVER_CONSENT_RECEIPT");
    expect(result.executionAllowed).toBe(false);
  });
  it("holds sensitive actions when AAC access is not yet attempted", () => {
    const result = review("confirm_support_booking", {
      decisionSpecificCommunicationAccess:"not_yet_attempted",
    });
    expect(result.decision).toBe("HOLD_BRANCH");
    expect(result.code).toBe("COMMUNICATION_ACCESS_UNRESOLVED");
  });
  it("lets participants draft synthetic enquiries, but not agents without a new choice", () => {
    expect(review("prepare_synthetic_enquiry").decision).toBe("ALLOW_WITH_SAFEGUARDS");
    expect(review("prepare_synthetic_enquiry", {actor:"participant_agent", participantChoseAction:false}).decision).toBe("HOLD_BRANCH");
  });
  it("never moves money or creates external orders even when a person clicks", () => {
    const result = review("create_product_order");
    expect(result.decision).toBe("HOLD_BRANCH");
    expect(result.executionAllowed).toBe(false);
  });
  it("blocks universal worker safety/quality scores based on incomplete data", () => {
    const result = review("publish_automatic_worker_safety_score");
    expect(result.decision).toBe("BLOCK_HARD_INVARIANT");
    expect(result.invariantRefs).toContain("Epistemic honesty");
  });
  it("keeps research access labels and source IDs for reproducibility", () => {
    expect(RESEARCH_GOVERNANCE_LEDGER.length).toBeGreaterThanOrEqual(3);
    expect(RESEARCH_GOVERNANCE_LEDGER.some(x=>x.source==="PubMed" && x.reference.startsWith("PMID:"))).toBe(true);
    expect(RESEARCH_GOVERNANCE_LEDGER.some(x=>x.source==="JSTOR" && x.evidenceAccess==="ABSTRACT_INSPECTED")).toBe(true);
  });
});
