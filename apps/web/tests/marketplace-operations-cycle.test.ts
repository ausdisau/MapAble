import { describe, expect, it } from "vitest";

import {
  EVIDENCE_CHECKS,
  createDemoCycle,
  demoActor,
  notionalLedgerBalance,
  transitionDemoCycle,
  type DemoAction,
  type DemoCycle,
  type DemoRole,
} from "../packages/marketplace-inclusive/src/operations-cycle";

const at = "2026-10-31T02:00:00.000Z";
const act = (state: DemoCycle, role: DemoRole, action: DemoAction, when = at) =>
  transitionDemoCycle(state, demoActor(role), action, when);

function vendorReviewed(): DemoCycle {
  let s = act(createDemoCycle(), "seller", { type: "submit_vendor" });
  for (const key of Object.keys(EVIDENCE_CHECKS) as (keyof typeof EVIDENCE_CHECKS)[]) {
    s = act(s, "reviewer", { type: "check_evidence", key });
  }
  return act(s, "reviewer", { type: "approve_vendor" });
}
function reserved(): DemoCycle {
  let s = vendorReviewed();
  s = act(s, "participant", { type: "prepare_quote", listingId: "demo-jar", quantity: 2 });
  return act(s, "participant", { type: "confirm_quote" });
}
function delivered(): DemoCycle {
  const d = act(reserved(), "seller", { type: "dispatch" });
  return act(d, "participant", { type: "acknowledge_delivery" });
}

describe("Marketplace assurance: supplier and product gates", () => {
  it("rejects approval before evidence and requires reviewer role", () => {
    const s = act(createDemoCycle(), "seller", { type: "submit_vendor" });
    expect(() => act(s, "reviewer", { type: "approve_vendor" })).toThrow();
    expect(() => act(s, "seller", { type: "check_evidence", key: "recall_screen" })).toThrow();
  });
  it("records only fictional evidence status and yields a nonbinding review", () => {
    const s = vendorReviewed();
    expect(s.vendor.status).toBe("sample_reviewed");
    expect(Object.values(s.vendor.evidence).every((v) => v === "sample_reviewed")).toBe(true);
    expect(s.audit[0].detail).toMatch(/fictional evidence/);
    expect(s.audit[s.audit.length - 1].detail).toMatch(/NOT real verification/);
  });
  it("prevents quoting until supplier review", () => {
    expect(() => act(createDemoCycle(), "participant", { type: "prepare_quote", listingId: "demo-jar", quantity: 1 })).toThrow();
  });
  it("enforces restricted and absent products, integers and stock", () => {
    const s = vendorReviewed();
    for (const listingId of ["demo-hoist", "demo-wheelchair", "missing"]) {
      expect(() => act(s, "participant", { type: "prepare_quote", listingId, quantity: 1 })).toThrow();
    }
    for (const quantity of [0, 2.3, 5]) {
      expect(() => act(s, "participant", { type: "prepare_quote", listingId: "demo-jar", quantity })).toThrow();
    }
  });
});

describe("Marketplace assurance: consent and participant choice", () => {
  it("never turns a role switch into authority", () => {
    const s = vendorReviewed();
    expect(() => act(s, "supporter", { type: "prepare_quote", listingId: "demo-jar", quantity: 1 })).toThrow();
    expect(() => act(s, "coordinator", { type: "prepare_quote", listingId: "demo-jar", quantity: 1 })).toThrow();
    expect(() => act(s, "reviewer", { type: "confirm_quote" })).toThrow();
  });
  it("allows a limited participant-issued preparation grant, not purchase confirmation", () => {
    let s = vendorReviewed();
    s = act(s, "participant", { type: "grant_prepare", delegateRole: "supporter", delegateActorId: demoActor("supporter").id });
    s = act(s, "supporter", { type: "prepare_quote", listingId: "demo-aac", quantity: 1 });
    expect(s.quote?.createdBy).toBe(demoActor("supporter").id);
    expect(() => act(s, "supporter", { type: "confirm_quote" })).toThrow();
    s = act(s, "participant", { type: "confirm_quote" });
    expect(s.order?.status).toBe("reserved_demo");
    expect(s.order?.paymentCapturedCents).toBe(0);
  });
  it("supports consent withdrawal and grant expiration", () => {
    let s = vendorReviewed();
    s = act(s, "participant", { type: "grant_prepare", delegateRole: "coordinator", delegateActorId: demoActor("coordinator").id });
    s = act(s, "participant", { type: "revoke_grant" });
    expect(() => act(s, "coordinator", { type: "prepare_quote", listingId: "demo-jar", quantity: 1 })).toThrow();
    const t = act(vendorReviewed(), "participant", { type: "grant_prepare", delegateRole: "supporter", delegateActorId: demoActor("supporter").id });
    expect(() => act(t, "supporter", { type: "prepare_quote", listingId: "demo-jar", quantity: 1 }, "2026-10-31T02:31:00.000Z")).toThrow();
  });
  it("blocks stale/expired quote and nonparticipant confirmation", () => {
    let s = vendorReviewed();
    s = act(s, "participant", { type: "prepare_quote", listingId: "demo-jar", quantity: 1 });
    expect(() => act(s, "coordinator", { type: "confirm_quote" })).toThrow();
    expect(() => act(s, "participant", { type: "confirm_quote" }, "2026-10-31T02:31:00.000Z")).toThrow();
  });
  it("binds the example quote to canonical product amount and inventory version", () => {
    const s = reserved();
    expect(s.quote?.unitExampleCents).toBe(2400);
    expect(s.quote?.itemSubtotalCents).toBe(4800);
    expect(s.quote?.shippingAssumptionCents).toBe(1200);
    expect(s.quote?.notionalTotalCents).toBe(6000);
    expect(s.quote?.binding).toBe(false);
    expect(s.stock["demo-jar"].available).toBe(2);
    expect(s.stock["demo-jar"].version).toBe(2);
    expect(s.ledger[0].amountCents).toBe(6000);
  });
});

describe("Marketplace assurance: fulfilment, rights and finance", () => {
  it("does not allow dispatch until participant approval", () => {
    expect(() => act(vendorReviewed(), "seller", { type: "dispatch" })).toThrow();
    expect(() => act(reserved(), "supporter", { type: "dispatch" })).toThrow();
  });
  it("supports participant cancellation with stock and notional reversal", () => {
    const s = act(reserved(), "participant", { type: "cancel_order" });
    expect(s.order?.status).toBe("cancelled_demo");
    expect(s.stock["demo-jar"].available).toBe(4);
    expect(s.ledger).toHaveLength(2);
    expect(notionalLedgerBalance(s.ledger)).toBe(0);
    expect(() => act(s, "seller", { type: "dispatch" })).toThrow();
  });
  it("keeps delivery acknowledgement under participant control", () => {
    let s = act(reserved(), "seller", { type: "dispatch" });
    s = act(s, "seller", { type: "record_delay" });
    expect(() => act(s, "seller", { type: "acknowledge_delivery" })).toThrow();
    s = act(s, "participant", { type: "acknowledge_delivery" });
    expect(s.order?.status).toBe("delivered_demo");
  });
  it("cannot refund without a returned item and a finance role", () => {
    expect(() => act(delivered(), "finance", { type: "approve_refund" })).toThrow();
    const s = act(delivered(), "participant", { type: "request_return" });
    expect(() => act(s, "seller", { type: "approve_return" })).toThrow();
    expect(() => act(s, "finance", { type: "approve_refund" })).toThrow();
  });
  it("supports the full approved return, notional refund and zero-cash reconciliation", () => {
    let s = act(delivered(), "participant", { type: "request_return" });
    s = act(s, "reviewer", { type: "approve_return" });
    s = act(s, "seller", { type: "receive_return" });
    s = act(s, "finance", { type: "approve_refund" });
    s = act(s, "finance", { type: "reconcile" });
    expect(s.order?.status).toBe("reconciled_demo");
    expect(s.ledger[1].amountCents).toBe(6000);
    expect(s.reconciliation?.actualExternalSettlementCents).toBe(0);
    expect(s.reconciliation?.notionalBalanceCents).toBe(0);
    expect(s.audit.map((e) => e.sequence)).toEqual(Array.from({length:s.audit.length},(_,i)=>i+1));
  });
  it("rejects corrupt ledger and backwards clock", () => {
    const s = reserved();
    expect(() => act(s, "seller", { type: "dispatch" }, "2026-10-31T01:00:00.000Z")).toThrow();
    const corrupted = {...s, ledger: [{...s.ledger[0], amountCents:-3}]};
    expect(() => notionalLedgerBalance(corrupted.ledger)).toThrow();
  });
});
