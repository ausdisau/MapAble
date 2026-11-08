import { describe, expect, it } from "vitest";

import { readLabGate, canOpenLab } from "@/lib/marketplace/agentic-lab/access";
import {
  compareSyntheticOffers, createLabSession, matchingSyntheticOffers,
  runLocalSequence, transitionLab, type LabAction, type LabActor, type LabSession,
} from "@/lib/marketplace/agentic-lab/engine";
import { projectSaleorProduct, reviewSaleorWrite, SALEOR_NETWORK_ADAPTER_ENABLED }
  from "@/lib/marketplace/agentic-lab/saleor-contract";
import { CURATED_AGENT_TOOLS, reviewAgentTool, REMOTE_A2A_ENABLED, REMOTE_MCP_ENABLED, EXTERNAL_PURCHASE_ENABLED }
  from "@/lib/marketplace/agentic-lab/tool-gateway";

function advance(s: LabSession, kind: LabAction["kind"], actor: LabActor, offerId?: string, id?: string) {
  return transitionLab(s, { kind, actor, offerId, expectedRevision: s.revision, id: id ?? "test-" + (s.revision + 1) });
}
function reachCollecting(s: LabSession) {
  return advance(advance(s, "prepare", "participant"), "approve_provider_preview", "participant");
}
function allProposals(s: LabSession, order?: readonly string[]) {
  const ids = order ?? matchingSyntheticOffers(s).map((offer) => offer.id);
  let current = s;
  for (const offerId of ids) current = advance(current, "provider_proposal", "provider_agent", offerId);
  return current;
}
describe("participant-controlled MapAble agentic marketplace research sandbox", () => {
  it("uses entirely fictional offers; nothing is presented as a verified service", () => {
    expect(matchingSyntheticOffers(createLabSession())).toHaveLength(3);
    expect(matchingSyntheticOffers(createLabSession("low_cost_at"))).toHaveLength(3);
    for (const item of matchingSyntheticOffers(createLabSession())) {
      expect(item.source).toBe("fictional_demo_only");
      expect(item.verifiedRegistration).toBe(false);
      expect(item.verifiedAvailability).toBe(false);
      expect(item.verifiedWorkerScreening).toBe(false);
      expect(item.sponsored).toBe(false);
    }
  });
  it("prohibits proposals before participant approves preview", () => {
    const state = advance(createLabSession(), "prepare", "participant");
    expect(() => advance(state, "provider_proposal", "provider_agent", "care-a")).toThrow();
  });
  it("prohibits simulated provider from declaring participant approval", () => {
    expect(() => advance(createLabSession(), "prepare", "provider_agent")).toThrow();
  });
  it("prohibits agent from shortlisting without participant action", () => {
    let state = allProposals(reachCollecting(createLabSession()));
    state = advance(state, "compare_all", "participant_agent");
    expect(() => advance(state, "shortlist", "provider_agent", "care-a")).toThrow();
  });
  it("blocks premature comparison and first-arrival shortlisting", () => {
    let state = reachCollecting(createLabSession());
    state = advance(state, "provider_proposal", "provider_agent", "care-c");
    expect(() => advance(state, "compare_all", "participant_agent")).toThrow();
    expect(() => advance(state, "shortlist", "participant", "care-c")).toThrow();
  });
  it("produces identical neutral comparison for different arrival order", () => {
    const ids = matchingSyntheticOffers(createLabSession()).map((offer) => offer.id);
    const first = advance(allProposals(reachCollecting(createLabSession()), ids), "compare_all", "participant_agent");
    const reverse = advance(allProposals(reachCollecting(createLabSession()), [...ids].reverse()), "compare_all", "participant_agent");
    expect(compareSyntheticOffers(first)).toEqual(compareSyntheticOffers(reverse));
    expect(compareSyntheticOffers(first).map((offer) => offer.id)).toEqual(["care-a", "care-b", "care-c"]);
  });
  it("preserves complete comparison even when most expensive offer arrives first", () => {
    const state = advance(allProposals(reachCollecting(createLabSession()), ["care-c", "care-a", "care-b"]), "compare_all", "participant_agent");
    expect(compareSyntheticOffers(state)).toHaveLength(3);
    expect(state.shortlistedOfferId).toBeNull();
  });
  it("lets participant shortlist after all offers, without creating booking", () => {
    let state = advance(allProposals(reachCollecting(createLabSession())), "compare_all", "participant_agent");
    state = advance(state, "shortlist", "participant", "care-b");
    expect(state.shortlistedOfferId).toBe("care-b");
    expect(state.phase).toBe("shortlisted");
    expect(state).not.toHaveProperty("order");
    expect(state).not.toHaveProperty("payment");
  });
  it("requires separately approved worker preview for acknowledgement", () => {
    let state = advance(allProposals(reachCollecting(createLabSession())), "compare_all", "participant_agent");
    state = advance(state, "shortlist", "participant", "care-a");
    expect(() => advance(state, "worker_acknowledge", "worker_agent")).toThrow();
    state = advance(state, "approve_worker_preview", "participant");
    state = advance(state, "worker_acknowledge", "worker_agent");
    expect(state.events.some((event) => event.action === "worker_acknowledge")).toBe(true);
    expect(state.events.every((event) => event.visibility === "local_demo_only")).toBe(true);
  });
  it("blocks worker handoff for an assistive technology product", () => {
    let state = advance(allProposals(reachCollecting(createLabSession("low_cost_at"))), "compare_all", "participant_agent");
    state = advance(state, "shortlist", "participant", "at-a");
    expect(() => advance(state, "approve_worker_preview", "participant")).toThrow();
  });
  it("preserves idempotency and rejects replay", () => {
    const state = advance(createLabSession(), "prepare", "participant", undefined, "nonce-once");
    expect(() => transitionLab(state, {
      kind: "approve_provider_preview", actor: "participant",
      id: "nonce-once", expectedRevision: state.revision,
    })).toThrow();
  });
  it("rejects stale revisions and unrelated offers", () => {
    const state = advance(createLabSession(), "prepare", "participant");
    expect(() => transitionLab(state, {
      kind: "approve_provider_preview", actor: "participant", id: "new", expectedRevision: 0,
    })).toThrow();
    const prepared = advance(state, "approve_provider_preview", "participant");
    expect(() => advance(prepared, "provider_proposal", "provider_agent", "not-an-offer")).toThrow();
  });
  it("refuses duplicate provider responses", () => {
    let state = reachCollecting(createLabSession());
    state = advance(state, "provider_proposal", "provider_agent", "care-a");
    expect(() => advance(state, "provider_proposal", "provider_agent", "care-a")).toThrow();
  });
  it("withdrawal removes sharing permission and shortlist and stops further action", () => {
    let state = advance(allProposals(reachCollecting(createLabSession())), "compare_all", "participant_agent");
    state = advance(state, "shortlist", "participant", "care-a");
    state = advance(state, "approve_worker_preview", "participant");
    state = advance(state, "withdraw", "participant");
    expect(state.phase).toBe("withdrawn");
    expect(state.providerPreviewApproved).toBe(false);
    expect(state.workerPreviewApproved).toBe(false);
    expect(state.shortlistedOfferId).toBeNull();
    expect(() => advance(state, "worker_acknowledge", "worker_agent")).toThrow();
  });
  it("cannot use an unapproved agent role to withdraw participant consent", () => {
    expect(() => advance(createLabSession(), "withdraw", "provider_agent")).toThrow();
  });
  it("supports deterministic no-LLM action replay", () => {
    const steps = [{ actor: "participant" as const, kind: "prepare" as const },
      { actor: "participant" as const, kind: "approve_provider_preview" as const }];
    const first = runLocalSequence(createLabSession(), steps);
    const second = runLocalSequence(createLabSession(), steps);
    expect(first).toEqual(second);
  });
});

describe("MCP gateway, Saleor and admission boundaries", () => {
  it("keeps external tool transport and Saleor network off", () => {
    expect(REMOTE_A2A_ENABLED).toBe(false);
    expect(REMOTE_MCP_ENABLED).toBe(false);
    expect(EXTERNAL_PURCHASE_ENABLED).toBe(false);
    expect(SALEOR_NETWORK_ADAPTER_ENABLED).toBe(false);
  });
  it("permits public read-only tool description and local prepare only", () => {
    expect(reviewAgentTool({ tool: "public_provider_evidence.read", participantChoseAction: false, requestedData: "public" }).decision).toBe("ALLOW_LOCAL_READ");
    expect(reviewAgentTool({ tool: "marketplace.enquiry.prepare", participantChoseAction: true, requestedData: "synthetic" }).decision).toBe("ALLOW_LOCAL_DRAFT");
    expect(reviewAgentTool({ tool: "marketplace.enquiry.prepare", participantChoseAction: false, requestedData: "synthetic" }).decision).toBe("BLOCK");
  });
  it("blocks all restricted external and private tools", () => {
    for (const tool of CURATED_AGENT_TOOLS.filter((t) => t.consequence === "restricted")) {
      expect(reviewAgentTool({ tool: tool.name, participantChoseAction: true, requestedData: "public" }).decision).toBe("BLOCK");
    }
    expect(reviewAgentTool({ tool: "unknown.superuser", participantChoseAction: true, requestedData: "public" }).decision).toBe("BLOCK");
    expect(reviewAgentTool({ tool: "public_provider_evidence.read", participantChoseAction: true, requestedData: "health" }).decision).toBe("BLOCK");
  });
  it("maps Saleor projections without claiming NDIS funding or binding price", () => {
    const projected = projectSaleorProduct({ productId: "P", variantId: "V", channel: "au",
      name: "Example", currency: "AUD", grossPriceCents: 1200, sourceObservedAt: "2026-11-02",
      sellerIdentityVerification: "unverified", productSafety: "unknown" });
    expect(projected.ndisFundingStatus).toBe("not_determined");
    expect(projected.binding).toBe(false);
    expect(projected.evidence).toBe("unverified");
    expect(reviewSaleorWrite("checkoutCreate").allowed).toBe(false);
  });
  it("rejects invalid projected Saleor prices and identifiers", () => {
    const sample = { productId: "P", variantId: "V", channel: "au",
      name: "Example", currency: "AUD" as const, grossPriceCents: -1, sourceObservedAt: "2026-11-02",
      sellerIdentityVerification: "unverified" as const, productSafety: "unknown" as const };
    expect(() => projectSaleorProduct(sample)).toThrow();
    expect(() => projectSaleorProduct({ ...sample, productId: "", grossPriceCents: 1200 })).toThrow();
  });
  it("keeps research UI off and denies unlisted participants", () => {
    expect(readLabGate({}).enabled).toBe(false);
    expect(canOpenLab({ id: "admin", primaryRole: "mapable_admin" }, readLabGate({}))).toBe(false);
    const gate = readLabGate({ MAPABLE_AGENTIC_MARKETPLACE_LAB_ENABLED: "true", MAPABLE_AGENTIC_MARKETPLACE_LAB_TESTER_IDS: "tester-a" });
    expect(canOpenLab(null, gate)).toBe(false);
    expect(canOpenLab({ id: "tester-a", primaryRole: "participant" }, gate)).toBe(true);
    expect(canOpenLab({ id: "random", primaryRole: "participant" }, gate)).toBe(false);
  });
});
