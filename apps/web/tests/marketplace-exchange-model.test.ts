import { describe, expect, it } from "vitest";

import {
  EMPTY_EXCHANGE, applyExchangeCommand, atCostBand, formatExampleDay,
  getVisibleAdvice, getVisibleQuotes, getVisibleRequests,
  getVisibleSupportNotes, makeSyntheticExchange, parseExampleDollars,
  quoteTotal, sellerCanOffer,
  type ExchangeCommand, type ExchangeIntent, type ExchangeState,
} from "@/lib/marketplace/dual-sided/exchange-model";
import { getCommerceOffer } from "@/lib/marketplace/design-lab-model";

const TODAY = "2026-10-31";
function apply(state: ExchangeState, intent: ExchangeIntent, commandId?: string, today = TODAY): ExchangeState {
  return applyExchangeCommand(state, {
    ...intent,
    commandId: commandId ?? "command-" + (state.revision + 1),
    expectedRevision: state.revision,
  } as ExchangeCommand, today);
}
function draft(offerId = "demo-jar"): ExchangeState {
  return apply(EMPTY_EXCHANGE, {
    type: "create_request", actorId: "participant", offerId,
    goal: "Compare this example against other options and review the price.",
  });
}
function shared(state: ExchangeState, recipient: "supplierBlue" | "providerLearning" | "independentAdvisor" | "coordinator"): ExchangeState {
  return apply(state, {
    type: "grant", actorId: "participant", requestId: "request-1",
    recipient, expiresOn: "2026-11-30",
  });
}
function quoted(): ExchangeState {
  return apply(shared(draft(), "supplierBlue"), {
    type: "propose_quote", actorId: "supplierBlue", requestId: "request-1",
    parts: { itemCents: 8900, deliveryCents: 1000, installationCents: 0, trainingCents: 0 },
    terms: "Illustrative seller conditions for the accessible item.",
  });
}

describe("MapAble Exchange synthetic domain and rights safeguards", () => {
  it("creates a repeatable, honest two-sided demo with no paid or approved status", () => {
    const state = makeSyntheticExchange(TODAY);
    expect(state.requests).toHaveLength(2);
    expect(state.quotes).toHaveLength(2);
    expect(state.advice).toHaveLength(1);
    expect(state.quotes.every(q => q.gstStatus === "not_reviewed" &&
      q.fundingStatus === "not_assessed" && q.supplierEvidenceStatus === "not_verified")).toBe(true);
    expect(state.events.every(e => !e.summary.includes("wheelchair") && !e.summary.includes("AAC"))).toBe(true);
    expect(state.requests[0].owner).toBe("participant");
  });

  it("rejects a coordinator, seller or assessor creating the participant's enquiry", () => {
    for (const actorId of ["coordinator", "supplierBlue", "providerLearning", "independentAdvisor"] as const) {
      expect(() => apply(EMPTY_EXCHANGE, {
        type: "create_request", actorId, offerId: "demo-jar",
        goal: "Please prepare this example product request.",
      })).toThrow(/Only the participant/);
    }
  });

  it("excludes restricted reuse equipment and unsuitable request inputs", () => {
    expect(() => draft("demo-hoist")).toThrow(/cannot be requested/);
    expect(() => draft("unknown-item")).toThrow(/cannot be requested/);
    expect(() => apply(EMPTY_EXCHANGE, {
      type: "create_request", actorId: "participant", offerId: "demo-jar",
      goal: "short",
    })).toThrow();
  });

  it("requires participant-selected, appropriate seller type before sharing", () => {
    expect(() => shared(draft(), "providerLearning")).toThrow(/cannot quote/);
    const service = draft("demo-training");
    expect(() => shared(service, "supplierBlue")).toThrow(/cannot quote/);
    expect(shared(service, "providerLearning").requests[0].status).toBe("shared");
  });

  it("prevents duplicate grants and requires time-limited access", () => {
    const state = shared(draft(), "supplierBlue");
    expect(() => shared(state, "supplierBlue")).toThrow(/already has an active grant/);
    expect(() => apply(draft(), {
      type: "grant", actorId: "participant", recipient: "supplierBlue",
      requestId: "request-1", expiresOn: "2027-07-01",
    })).toThrow(/90 days/);
    expect(() => apply(draft(), {
      type: "grant", actorId: "participant", recipient: "supplierBlue",
      requestId: "request-1", expiresOn: "2026-10-30",
    })).toThrow(/past/);
    expect(formatExampleDay(30, TODAY)).toBe("2026-11-30");
  });

  it("does not grant visibility to uninvited suppliers or coordinators", () => {
    const state = shared(draft(), "supplierBlue");
    expect(getVisibleRequests(state, "supplierBlue", TODAY)).toHaveLength(1);
    expect(getVisibleRequests(state, "supplierBlue", TODAY)[0].grants).toEqual([]);
    expect(getVisibleRequests(state, "participant", TODAY)[0].grants).toHaveLength(1);
    expect(getVisibleRequests(state, "supplierGold", TODAY)).toHaveLength(0);
    expect(getVisibleRequests(state, "providerCare", TODAY)).toHaveLength(0);
    expect(getVisibleRequests(state, "coordinator", TODAY)).toHaveLength(0);
    expect(getVisibleRequests(state, "independentAdvisor", TODAY)).toHaveLength(0);
    expect(getVisibleRequests(state, "supplierBlue", "2026-12-01")).toHaveLength(0);
  });

  it("hides a revoked request from the seller, but retains participant audit rights", () => {
    const state = quoted();
    const grant = state.requests[0].grants[0];
    const revoked = apply(state, {
      type: "revoke", actorId: "participant", requestId: "request-1", grantId: grant.id,
    });
    expect(getVisibleRequests(revoked, "supplierBlue", TODAY)).toHaveLength(0);
    expect(getVisibleRequests(revoked, "participant", TODAY)).toHaveLength(1);
    expect(getVisibleQuotes(revoked, revoked.requests[0], "participant", TODAY)).toHaveLength(1);
    expect(() => apply(revoked, {
      type: "withdraw_quote", actorId: "supplierBlue", requestId: "request-1", quoteId: "quote-1",
    })).toThrow(/not granted/);
  });

  it("allows the matching seller to propose a nonbinding, itemised quotation", () => {
    const state = quoted();
    expect(state.quotes[0].totalCents).toBe(9900);
    expect(state.quotes[0].status).toBe("proposed");
    expect(state.quotes[0].fundingStatus).toBe("not_assessed");
    const projected = getVisibleRequests(state, "supplierBlue", TODAY)[0];
    expect(projected.grants).toEqual([]);
    expect(getVisibleQuotes(state, projected, "supplierBlue", TODAY)).toHaveLength(1);
    expect(getVisibleQuotes(state, state.requests[0], "coordinator", TODAY)).toHaveLength(0);
  });

  it("prevents quoting before permission and after expiry or withdrawal", () => {
    const state = draft();
    const proposal = {
      type: "propose_quote", actorId: "supplierBlue", requestId: "request-1",
      parts: { itemCents: 1000, deliveryCents: 0, installationCents: 0, trainingCents: 0 },
      terms: "Example terms with adequate supporting information.",
    } as const;
    expect(() => apply(state, proposal)).toThrow();
    expect(() => apply(shared(state, "supplierBlue"), proposal, undefined, "2026-12-01"))
      .toThrow(/not granted/);
    const active = shared(state, "supplierBlue");
    expect(() => apply(active, { ...proposal, actorId: "supplierGold" })).toThrow(/not granted/);
  });

  it("does not allow prices outside safe integer-cent bounds or manipulated notation", () => {
    expect(parseExampleDollars("19.99")).toBe(1999);
    expect(parseExampleDollars("0.2")).toBe(20);
    expect(parseExampleDollars("100")).toBe(10000);
    for (const amount of ["-1", "1e3", "1.999", "$100", "10,000", "100000.01", ""]) {
      expect(() => parseExampleDollars(amount)).toThrow();
    }
    expect(() => quoteTotal({ itemCents: 1000.2, deliveryCents: 0, installationCents: 0, trainingCents: 0 })).toThrow();
    expect(() => quoteTotal({ itemCents: 0, deliveryCents: 0, installationCents: 0, trainingCents: 0 })).toThrow();
    expect(atCostBand(149_999)).toBe("low");
    expect(atCostBand(150_000)).toBe("mid");
    expect(atCostBand(1_500_000)).toBe("mid");
    expect(atCostBand(1_500_001)).toBe("high");
  });

  it("is idempotent for duplicate command IDs and rejects stale revisions", () => {
    const state = draft();
    const same = applyExchangeCommand(state, {
      type: "create_request", actorId: "participant", offerId: "demo-jar",
      goal: "An example question with sufficient characters.",
      commandId: "command-1", expectedRevision: 0,
    }, TODAY);
    expect(same).toBe(state);
    expect(() => applyExchangeCommand(state, {
      type: "create_request", actorId: "participant", offerId: "demo-jar",
      goal: "An example question with sufficient characters.",
      commandId: "another-action-2", expectedRevision: 0,
    }, TODAY)).toThrow(/stale/);
  });

  it("supports independent advisor notes but cannot turn them into clinical assessments", () => {
    const withAdvisor = shared(draft("demo-chair"), "independentAdvisor");
    const state = apply(withAdvisor, {
      type: "add_advice", actorId: "independentAdvisor", requestId: "request-1",
      text: "A qualified clinical assessment and trial would need to be arranged.",
    });
    expect(state.advice[0].evidenceStatus).toBe("simulation_only_not_a_clinical_assessment");
    const projected = getVisibleRequests(state, "independentAdvisor", TODAY)[0];
    expect(projected.grants).toEqual([]);
    expect(getVisibleAdvice(state, projected, "independentAdvisor", TODAY)).toHaveLength(1);
    expect(getVisibleAdvice(state, state.requests[0], "supplierBlue", TODAY)).toHaveLength(0);
    expect(() => apply(withAdvisor, {
      type: "add_advice", actorId: "supplierBlue", requestId: "request-1",
      text: "Attempted unauthorised clinical note in the example.",
    })).toThrow();
    expect(() => apply(withAdvisor, {
      type: "shortlist_quote", actorId: "independentAdvisor", requestId: "request-1", quoteId: "quote-1",
    })).toThrow(/Only the participant/);
  });

  it("lets a chosen coordinator assist without quote or decision authority", () => {
    const state = shared(draft(), "coordinator");
    const helped = apply(state, {
      type: "add_support_note", actorId: "coordinator", requestId: "request-1",
      text: "Prepare a comparison of terms and ask what would help the participant.",
    });
    expect(helped.supportNotes[0].authority).toBe("assistance_only_no_purchase_authority");
    expect(getVisibleSupportNotes(helped, helped.requests[0], "participant", TODAY)).toHaveLength(1);
    const projected = getVisibleRequests(helped, "coordinator", TODAY)[0];
    expect(projected.grants).toEqual([]);
    expect(getVisibleSupportNotes(helped, projected, "coordinator", TODAY)).toHaveLength(1);
    expect(getVisibleQuotes(helped, helped.requests[0], "coordinator", TODAY)).toHaveLength(0);
    expect(() => apply(helped, {
      type: "close_request", actorId: "coordinator", requestId: "request-1",
    })).toThrow(/Only the participant/);
  });

  it("participant shortlisting is nonbinding; only they can decline quotes", () => {
    const state = quoted();
    expect(() => apply(state, {
      type: "shortlist_quote", actorId: "coordinator", requestId: "request-1", quoteId: "quote-1",
    })).toThrow(/Only the participant/);
    const selected = apply(state, {
      type: "shortlist_quote", actorId: "participant", requestId: "request-1", quoteId: "quote-1",
    });
    expect(selected.quotes[0].status).toBe("shortlisted");
    expect(selected.events.at(-1)?.summary).toMatch(/no purchase was authorised/);
    expect(() => apply(selected, {
      type: "decline_quote", actorId: "participant", requestId: "request-1", quoteId: "quote-1",
    })).toThrow(/Only an active/);
    const declined = apply(state, {
      type: "decline_quote", actorId: "participant", requestId: "request-1", quoteId: "quote-1",
    });
    expect(declined.quotes[0].status).toBe("declined");
  });

  it("seller withdrawal cannot be performed by a different vendor", () => {
    const state = quoted();
    expect(() => apply(state, {
      type: "withdraw_quote", actorId: "supplierGold", requestId: "request-1", quoteId: "quote-1",
    })).toThrow(/originating seller/);
    const next = apply(state, {
      type: "withdraw_quote", actorId: "supplierBlue", requestId: "request-1", quoteId: "quote-1",
    });
    expect(next.quotes[0].status).toBe("withdrawn");
  });

  it("closing revokes all grants and blocks new quotes, advice and support actions", () => {
    const state = shared(draft(), "supplierBlue");
    const closed = apply(state, {
      type: "close_request", actorId: "participant", requestId: "request-1",
    });
    expect(closed.requests[0].status).toBe("closed");
    expect(closed.requests[0].grants.every(g => !g.active)).toBe(true);
    expect(getVisibleRequests(closed, "supplierBlue", TODAY)).toHaveLength(0);
    expect(() => apply(closed, {
      type: "propose_quote", actorId: "supplierBlue", requestId: "request-1",
      parts: { itemCents: 1200, deliveryCents: 0, installationCents: 0, trainingCents: 0 },
      terms: "Example quote may not be created after closure.",
    })).toThrow(/closed/);
  });

  it("prevents suppliers from quoting on services and providers quoting on goods", () => {
    expect(sellerCanOffer(getCommerceOffer("demo-chair")!, "supplierBlue")).toBe(true);
    expect(sellerCanOffer(getCommerceOffer("demo-chair")!, "providerLearning")).toBe(false);
    expect(sellerCanOffer(getCommerceOffer("demo-training")!, "providerLearning")).toBe(true);
    expect(sellerCanOffer(getCommerceOffer("demo-training")!, "supplierGold")).toBe(false);
  });
});
