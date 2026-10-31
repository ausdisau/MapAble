/**
 * MapAble Marketplace — synthetic one-cycle commerce assurance emulator.
 *
 * This is an educational, ephemeral state machine. It grants NO legal authority,
 * does not authenticate sellers, inspect real goods, reserve live stock,
 * create an enforceable order, or move money. Never expose as production commerce.
 *
 * Existing inclusive Marketplace catalogue is the single illustrative pricing
 * source. All transitions are actor-scoped and append an auditable synthetic event.
 */
import {
  findMarketListing,
  type MarketListing,
} from "./index";

export const DEMO_PARTICIPANT_ID = "synthetic-participant";
export const DEMO_VENDOR_ID = "synthetic-vendor";
export type DemoRole = "participant" | "supporter" | "coordinator" | "seller" | "reviewer" | "finance";
export type DelegateRole = "supporter" | "coordinator";
export type EvidenceKey =
  | "seller_identity"
  | "business_contact"
  | "product_ownership"
  | "product_condition"
  | "recall_screen"
  | "returns_and_insurance";

export const EVIDENCE_CHECKS: Readonly<Record<EvidenceKey, string>> = {
  seller_identity: "Seller identity (sample evidence)",
  business_contact: "Business contact and identity (sample evidence)",
  product_ownership: "Product ownership/provenance (sample evidence)",
  product_condition: "Condition and suitability scope (sample evidence)",
  recall_screen: "Recall search (sample evidence)",
  returns_and_insurance: "Returns, insurance and product responsibility (sample evidence)",
};

export type VendorStatus = "draft" | "submitted" | "sample_reviewed" | "sample_rejected";
export type EvidenceStatus = "unreviewed" | "sample_reviewed";
export type QuoteStatus = "prepared" | "participant_confirmed" | "cancelled";
export type DemoOrderStatus =
  | "reserved_demo"
  | "dispatched_demo"
  | "delayed_demo"
  | "delivered_demo"
  | "return_requested_demo"
  | "return_approved_demo"
  | "returned_demo"
  | "refunded_demo"
  | "reconciled_demo"
  | "cancelled_demo";

export interface DemoActor {
  readonly id: string;
  readonly role: DemoRole;
}
export interface DemoGrant {
  readonly delegateRole: DelegateRole;
  readonly delegateActorId: string;
  readonly scope: "prepare_quote";
  readonly expiresAt: string;
  readonly revoked: boolean;
}
export interface DemoVendor {
  readonly id: string;
  readonly status: VendorStatus;
  readonly evidence: Readonly<Record<EvidenceKey, EvidenceStatus>>;
}
export interface DemoQuote {
  readonly id: string;
  readonly revision: number;
  readonly status: QuoteStatus;
  readonly createdBy: string;
  readonly listingId: string;
  readonly quantity: number;
  readonly unitExampleCents: number;
  readonly stockVersion: number;
  readonly itemSubtotalCents: number;
  readonly shippingAssumptionCents: 1200;
  readonly taxAssumptionCents: 0;
  readonly notionalTotalCents: number;
  readonly currency: "AUD";
  readonly expiresAt: string;
  readonly binding: false;
}
export interface DemoOrder {
  readonly id: string;
  readonly quoteId: string;
  readonly status: DemoOrderStatus;
  readonly totalNotionalCents: number;
  readonly paymentCapturedCents: 0;
  readonly inventoryReserved: boolean;
}
export interface DemoLedgerEntry {
  readonly action: "notional_reservation" | "notional_reversal";
  readonly debitAccount: "simulated_receivable" | "simulated_vendor_liability";
  readonly creditAccount: "simulated_vendor_liability" | "simulated_receivable";
  readonly amountCents: number;
}
export interface DemoReconciliation {
  readonly status: "matched_simulation";
  readonly expectedExternalSettlementCents: 0;
  readonly actualExternalSettlementCents: 0;
  readonly notionalBalanceCents: 0;
}
export interface DemoAudit {
  readonly sequence: number;
  readonly action: DemoAction["type"];
  readonly actor: DemoRole;
  readonly actorId: string;
  readonly at: string;
  readonly detail: string;
}
export interface DemoCycle {
  readonly vendor: DemoVendor;
  readonly grant: DemoGrant | null;
  readonly stock: Readonly<Record<string, { readonly available: number; readonly version: number }>>;
  readonly quote: DemoQuote | null;
  readonly order: DemoOrder | null;
  readonly ledger: readonly DemoLedgerEntry[];
  readonly reconciliation: DemoReconciliation | null;
  readonly audit: readonly DemoAudit[];
}

export type DemoAction =
  | { readonly type: "submit_vendor" }
  | { readonly type: "check_evidence"; readonly key: EvidenceKey }
  | { readonly type: "approve_vendor" }
  | { readonly type: "reject_vendor" }
  | { readonly type: "grant_prepare"; readonly delegateRole: DelegateRole; readonly delegateActorId: string }
  | { readonly type: "revoke_grant" }
  | { readonly type: "prepare_quote"; readonly listingId: string; readonly quantity: number }
  | { readonly type: "confirm_quote" }
  | { readonly type: "cancel_order" }
  | { readonly type: "dispatch" }
  | { readonly type: "record_delay" }
  | { readonly type: "acknowledge_delivery" }
  | { readonly type: "request_return" }
  | { readonly type: "approve_return" }
  | { readonly type: "receive_return" }
  | { readonly type: "approve_refund" }
  | { readonly type: "reconcile" };

export class DemoCycleError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "DemoCycleError";
  }
}

const deny = (code: string, message: string): never => {
  throw new DemoCycleError(code, message);
};
const hasRole = (actor: DemoActor, role: DemoRole): void => {
  if (actor.role !== role) deny("ROLE_DENIED", "This simulated step requires the " + role + " role.");
};
const isParticipant = (actor: DemoActor): boolean =>
  actor.role === "participant" && actor.id === DEMO_PARTICIPANT_ID;
const ensureParticipant = (actor: DemoActor): void => {
  if (!isParticipant(actor)) deny("PARTICIPANT_REQUIRED", "Only the simulated participant can confirm, withdraw or decide.");
};
const validAt = (iso: string): number => {
  const n = Date.parse(iso);
  if (!Number.isFinite(n)) deny("INVALID_TIME", "A valid ISO date is required.");
  return n;
};
const isDelegate = (state: DemoCycle, actor: DemoActor, at: string): boolean => {
  const grant = state.grant;
  return Boolean(
    grant && !grant.revoked && grant.scope === "prepare_quote" &&
    actor.id === grant.delegateActorId && actor.role === grant.delegateRole &&
    validAt(at) < validAt(grant.expiresAt),
  );
};
const allSampled = (vendor: DemoVendor): boolean =>
  (Object.keys(EVIDENCE_CHECKS) as EvidenceKey[]).every(
    (key) => vendor.evidence[key] === "sample_reviewed",
  );

export const SIMULATION_LISTING_IDS = [
  "demo-jar", "demo-keyboard", "demo-aac", "demo-cutlery",
] as const;

export function createDemoCycle(): DemoCycle {
  const evidence = Object.fromEntries(
    (Object.keys(EVIDENCE_CHECKS) as EvidenceKey[]).map((key) => [key, "unreviewed"]),
  ) as Record<EvidenceKey, EvidenceStatus>;
  return {
    vendor: { id: DEMO_VENDOR_ID, status: "draft", evidence },
    grant: null,
    stock: {
      "demo-jar": { available: 4, version: 1 },
      "demo-keyboard": { available: 3, version: 1 },
      "demo-aac": { available: 3, version: 1 },
      "demo-cutlery": { available: 3, version: 1 },
    },
    quote: null, order: null, ledger: [], reconciliation: null, audit: [],
  };
}

export function demoActor(role: DemoRole): DemoActor {
  return {
    role,
    id: role === "participant"
      ? DEMO_PARTICIPANT_ID
      : "synthetic-actor-" + role,
  };
}

/** No real product, supplier or price information can be passed by the actor. */
function checkedListing(state: DemoCycle, id: string, qty: number): MarketListing {
  const item = findMarketListing(id);
  if (!item || !SIMULATION_LISTING_IDS.some((x) => x === id))
    deny("UNKNOWN_PRODUCT", "This item is not part of the synthetic assurance scenario.");
  if (item.risk !== "reviewed-low-risk-type" || item.examplePriceCents === null)
    deny("SPECIALIST_REQUIRED", "An eligible low-risk demonstration item is required.");
  if (!Number.isInteger(qty) || qty < 1 || qty > 5)
    deny("INVALID_QUANTITY", "Quantity must be a whole number between one and five.");
  if ((state.stock[id]?.available ?? 0) < qty)
    deny("OUT_OF_STOCK", "The synthetic stock count is too low.");
  return item;
}

export function notionalLedgerBalance(entries: readonly DemoLedgerEntry[]): number {
  const byAccount = new Map<string, number>();
  for (const line of entries) {
    if (!Number.isInteger(line.amountCents) || line.amountCents < 1)
      deny("LEDGER_INVALID", "Invalid notional ledger entry.");
    byAccount.set(line.debitAccount, (byAccount.get(line.debitAccount) ?? 0) + line.amountCents);
    byAccount.set(line.creditAccount, (byAccount.get(line.creditAccount) ?? 0) - line.amountCents);
  }
  return [...byAccount.values()].reduce((sum, value) => sum + value, 0);
}

export function transitionDemoCycle(
  source: DemoCycle,
  actor: DemoActor,
  action: DemoAction,
  at: string,
): DemoCycle {
  const now = validAt(at);
  if (source.audit.length && now < validAt(source.audit[source.audit.length - 1].at))
    deny("CLOCK_REGRESSION", "Demo event time cannot move backwards.");
  let state: DemoCycle = source;
  let detail: string = action.type;

  switch (action.type) {
    case "submit_vendor": {
      hasRole(actor, "seller");
      if (state.vendor.status !== "draft") deny("INVALID_STATE", "Supplier has already been submitted.");
      state = { ...state, vendor: { ...state.vendor, status: "submitted" } };
      detail = "Synthetic seller submitted fictional evidence; no identity checked.";
      break;
    }
    case "check_evidence": {
      hasRole(actor, "reviewer");
      if (state.vendor.status !== "submitted") deny("INVALID_STATE", "Supplier must submit first.");
      if (!(action.key in EVIDENCE_CHECKS)) deny("INVALID_EVIDENCE", "Unknown checklist category.");
      state = {
        ...state,
        vendor: {
          ...state.vendor,
          evidence: { ...state.vendor.evidence, [action.key]: "sample_reviewed" },
        },
      };
      detail = EVIDENCE_CHECKS[action.key] + " recorded as a fictional reviewer exercise.";
      break;
    }
    case "approve_vendor": {
      hasRole(actor, "reviewer");
      if (state.vendor.status !== "submitted" || !allSampled(state.vendor))
        deny("EVIDENCE_INCOMPLETE", "Every synthetic evidence category needs review.");
      state = { ...state, vendor: { ...state.vendor, status: "sample_reviewed" } };
      detail = "Simulation-only review complete; NOT real verification or onboarding.";
      break;
    }
    case "reject_vendor": {
      hasRole(actor, "reviewer");
      if (state.vendor.status !== "submitted") deny("INVALID_STATE", "Supplier must submit first.");
      state = { ...state, vendor: { ...state.vendor, status: "sample_rejected" } };
      detail = "Synthetic supplier rejected; no quote may be prepared.";
      break;
    }
    case "grant_prepare": {
      ensureParticipant(actor);
      if (action.delegateRole !== "supporter" && action.delegateRole !== "coordinator")
        deny("INVALID_DELEGATE", "Only chosen supporter or coordinator may prepare a quote.");
      const expected = demoActor(action.delegateRole).id;
      if (action.delegateActorId !== expected)
        deny("INVALID_DELEGATE", "Actor must match the chosen synthetic delegate.");
      state = {
        ...state,
        grant: {
          delegateRole: action.delegateRole, delegateActorId: expected,
          scope: "prepare_quote",
          expiresAt: new Date(now + 30 * 60 * 1000).toISOString(),
          revoked: false,
        },
      };
      detail = "Participant granted 30-minute prepare-only simulated permission.";
      break;
    }
    case "revoke_grant": {
      ensureParticipant(actor);
      if (!state.grant || state.grant.revoked)
        deny("INVALID_STATE", "There is no active simulated grant.");
      state = { ...state, grant: { ...state.grant, revoked: true } };
      detail = "Participant withdrew the preparation permission.";
      break;
    }
    case "prepare_quote": {
      if (!isParticipant(actor) && !isDelegate(state, actor, at))
        deny("NO_AUTHORITY", "Only participant or a currently authorised preparer may draft.");
      if (state.vendor.status !== "sample_reviewed")
        deny("VENDOR_NOT_REVIEWED", "The fictional supplier must pass the simulated review.");
      if (state.order && !["cancelled_demo","reconciled_demo"].includes(state.order.status))
        deny("ORDER_IN_PROGRESS", "Complete or cancel the current simulated order.");
      const item = checkedListing(state, action.listingId, action.quantity);
      const unit = item.examplePriceCents!;
      const subtotal = unit * action.quantity;
      const revision = (state.quote?.revision ?? 0) + 1;
      state = {
        ...state,
        quote: {
          id: "demo-quote-" + revision,
          revision,
          status: "prepared",
          createdBy: actor.id,
          listingId: item.id,
          quantity: action.quantity,
          unitExampleCents: unit,
          stockVersion: state.stock[item.id].version,
          itemSubtotalCents: subtotal,
          shippingAssumptionCents: 1200,
          taxAssumptionCents: 0,
          notionalTotalCents: subtotal + 1200,
          currency: "AUD",
          expiresAt: new Date(now + 30 * 60 * 1000).toISOString(),
          binding: false,
        },
        order: null,
        ledger: [],
        reconciliation: null,
      };
      detail = item.title + " — sample quote prepared; no seller contacted.";
      break;
    }
    case "confirm_quote": {
      ensureParticipant(actor);
      const quote = state.quote;
      if (!quote || quote.status !== "prepared") deny("INVALID_STATE", "No confirmable quote exists.");
      if (now >= validAt(quote.expiresAt)) deny("QUOTE_EXPIRED", "Quote expired; prepare a new example.");
      if (state.vendor.status !== "sample_reviewed") deny("VENDOR_NOT_REVIEWED", "Supplier review is missing.");
      const item = checkedListing(state, quote.listingId, quote.quantity);
      if (item.examplePriceCents !== quote.unitExampleCents ||
          state.stock[item.id].version !== quote.stockVersion)
        deny("STALE_QUOTE", "The sample price or stock version changed; prepare again.");
      const inventory = state.stock[item.id];
      state = {
        ...state,
        quote: { ...quote, status: "participant_confirmed" },
        stock: {
          ...state.stock,
          [item.id]: { available: inventory.available - quote.quantity, version: inventory.version + 1 },
        },
        order: {
          id: "demo-order-" + quote.revision,
          quoteId: quote.id,
          status: "reserved_demo",
          totalNotionalCents: quote.notionalTotalCents,
          paymentCapturedCents: 0,
          inventoryReserved: true,
        },
        ledger: [{
          action: "notional_reservation",
          debitAccount: "simulated_receivable",
          creditAccount: "simulated_vendor_liability",
          amountCents: quote.notionalTotalCents,
        }],
      };
      detail = "Participant confirmed a FICTIONAL order; zero payment or real stock changed.";
      break;
    }
    case "cancel_order": {
      ensureParticipant(actor);
      if (!state.order || state.order.status !== "reserved_demo" || !state.quote)
        deny("INVALID_STATE", "Only a not-yet-dispatched mock order can be cancelled.");
      const item = state.quote.listingId, inventory = state.stock[item];
      state = {
        ...state,
        order: { ...state.order, status: "cancelled_demo", inventoryReserved: false },
        stock: { ...state.stock, [item]: { available: inventory.available + state.quote.quantity, version: inventory.version + 1 } },
        ledger: [...state.ledger, {
          action: "notional_reversal",
          debitAccount: "simulated_vendor_liability",
          creditAccount: "simulated_receivable",
          amountCents: state.order.totalNotionalCents,
        }],
      };
      detail = "Participant cancelled mock order; inventory and notional ledger reversed.";
      break;
    }
    case "dispatch": {
      hasRole(actor, "seller");
      if (state.order?.status !== "reserved_demo") deny("INVALID_STATE", "Only reserved mock orders can be dispatched.");
      state = { ...state, order: { ...state.order, status: "dispatched_demo" } };
      detail = "Synthetic parcel dispatched; no transport was booked.";
      break;
    }
    case "record_delay": {
      hasRole(actor, "seller");
      if (state.order?.status !== "dispatched_demo") deny("INVALID_STATE", "Only dispatched mock orders can be delayed.");
      state = { ...state, order: { ...state.order, status: "delayed_demo" } };
      detail = "Demo delay recorded; human contact is required in a real service.";
      break;
    }
    case "acknowledge_delivery": {
      ensureParticipant(actor);
      if (!state.order || !["dispatched_demo","delayed_demo"].includes(state.order.status))
        deny("INVALID_STATE", "The mock order has not been dispatched.");
      state = { ...state, order: { ...state.order, status: "delivered_demo" } };
      detail = "Participant marked fictional delivery received; no real proof collected.";
      break;
    }
    case "request_return": {
      ensureParticipant(actor);
      if (state.order?.status !== "delivered_demo") deny("INVALID_STATE", "No delivered mock order to return.");
      state = { ...state, order: { ...state.order, status: "return_requested_demo" } };
      detail = "Participant requested a simulated return; human review required.";
      break;
    }
    case "approve_return": {
      hasRole(actor, "reviewer");
      if (state.order?.status !== "return_requested_demo") deny("INVALID_STATE", "Return has not been requested.");
      state = { ...state, order: { ...state.order, status: "return_approved_demo" } };
      detail = "Human role approved fictional return; no consumer right was determined.";
      break;
    }
    case "receive_return": {
      hasRole(actor, "seller");
      if (state.order?.status !== "return_approved_demo") deny("INVALID_STATE", "Return has not been approved.");
      state = { ...state, order: { ...state.order, status: "returned_demo" } };
      detail = "Synthetic item returned; safety reinspection needed before actual reuse.";
      break;
    }
    case "approve_refund": {
      hasRole(actor, "finance");
      if (state.order?.status !== "returned_demo") deny("INVALID_STATE", "Refund cannot precede a simulated returned item.");
      state = {
        ...state,
        order: { ...state.order, status: "refunded_demo" },
        ledger: [...state.ledger, {
          action: "notional_reversal",
          debitAccount: "simulated_vendor_liability",
          creditAccount: "simulated_receivable",
          amountCents: state.order.totalNotionalCents,
        }],
      };
      detail = "Finance role authorised notional reversal; NO real refund issued.";
      break;
    }
    case "reconcile": {
      hasRole(actor, "finance");
      if (state.order?.status !== "refunded_demo")
        deny("INVALID_STATE", "Reconcile only after the synthetic return/refund sequence.");
      if (state.ledger.length !== 2 ||
          state.ledger[0].amountCents !== state.ledger[1].amountCents ||
          state.ledger[0].action !== "notional_reservation" ||
          state.ledger[1].action !== "notional_reversal" ||
          notionalLedgerBalance(state.ledger) !== 0)
        deny("LEDGER_MISMATCH", "Notional debit and reversal do not match.");
      state = {
        ...state,
        order: { ...state.order, status: "reconciled_demo" },
        reconciliation: {
          status: "matched_simulation",
          expectedExternalSettlementCents: 0,
          actualExternalSettlementCents: 0,
          notionalBalanceCents: 0,
        },
      };
      detail = "Balanced FICTIONAL reconciliation; no processor or bank statement inspected.";
      break;
    }
    default:
      return deny("UNKNOWN_ACTION", "Unsupported action.");
  }

  return {
    ...state,
    audit: [
      ...state.audit,
      {
        sequence: source.audit.length + 1,
        action: action.type,
        actor: actor.role, actorId: actor.id,
        at, detail,
      },
    ],
  };
}
