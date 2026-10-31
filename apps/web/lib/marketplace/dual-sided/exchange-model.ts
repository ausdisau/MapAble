/**
 * MapAble buyer/seller/advisor Exchange — SYNTHETIC, client-memory prototype.
 *
 * The policy interpreter demonstrates required server-side boundaries but is
 * NOT authentication or live authorization. Actor switching in the demo is
 * deliberately possible and must never be used with real records.
 *
 * Nothing here can create an order, payment, clinical prescription, NDIS claim,
 * verified credential, message delivery, invoice, booking or seller approval.
 */
import {
  COMMERCE_LAB_OFFERS,
  getCommerceOffer,
  type CommerceOffer,
} from "@/lib/marketplace/design-lab-model";

export const DEMO_ACTORS = {
  participant: { id: "participant", name: "Example participant", role: "participant" },
  coordinator: { id: "coordinator", name: "Example support coordinator", role: "coordinator" },
  supplierBlue: { id: "supplierBlue", name: "Example equipment supplier A", role: "supplier" },
  supplierGold: { id: "supplierGold", name: "Example equipment supplier B", role: "supplier" },
  providerCare: { id: "providerCare", name: "Example community provider", role: "provider" },
  providerLearning: { id: "providerLearning", name: "Example training provider", role: "provider" },
  independentAdvisor: { id: "independentAdvisor", name: "Example independent AT advisor", role: "advisor" },
} as const;

export type ExchangeActorId = keyof typeof DEMO_ACTORS;
export type ExchangeRole = (typeof DEMO_ACTORS)[ExchangeActorId]["role"];
export type ExchangeGrantScope = "quote" | "advice" | "support";
export type ExchangeRequestStatus = "draft" | "shared" | "closed";
export type ExchangeQuoteStatus = "proposed" | "shortlisted" | "declined" | "withdrawn";
export type ExchangeActionKind =
  | "request.created" | "grant.created" | "grant.revoked"
  | "quote.proposed" | "quote.shortlisted" | "quote.declined" | "quote.withdrawn"
  | "advisor.note_added" | "coordinator.note_added" | "request.closed";

export interface ExchangeGrant {
  readonly id: string;
  readonly requestId: string;
  readonly recipient: ExchangeActorId;
  readonly scope: ExchangeGrantScope;
  readonly expiresOn: string;
  readonly active: boolean;
}

export interface ExchangeRequest {
  readonly id: string;
  readonly offerId: string;
  readonly goal: string;
  readonly owner: "participant";
  readonly status: ExchangeRequestStatus;
  readonly grants: readonly ExchangeGrant[];
}

export interface QuoteParts {
  /** Nonbinding, seller-entered demonstration values in Australian cents. */
  readonly itemCents: number;
  readonly deliveryCents: number;
  readonly installationCents: number;
  readonly trainingCents: number;
}

export interface ExchangeQuote {
  readonly id: string;
  readonly requestId: string;
  readonly sellerId: ExchangeActorId;
  readonly parts: QuoteParts;
  readonly totalCents: number;
  readonly terms: string;
  readonly status: ExchangeQuoteStatus;
  readonly gstStatus: "not_reviewed";
  readonly fundingStatus: "not_assessed";
  readonly supplierEvidenceStatus: "not_verified";
}

export interface ExchangeAdvice {
  readonly id: string;
  readonly requestId: string;
  readonly advisorId: "independentAdvisor";
  readonly text: string;
  readonly evidenceStatus: "simulation_only_not_a_clinical_assessment";
}

export interface ExchangeSupportNote {
  readonly id: string;
  readonly requestId: string;
  readonly coordinatorId: "coordinator";
  readonly text: string;
  readonly authority: "assistance_only_no_purchase_authority";
}

export interface ExchangeAudit {
  readonly sequence: number;
  readonly actorId: ExchangeActorId;
  readonly kind: ExchangeActionKind;
  readonly requestId: string;
  readonly summary: string; // predefined low-detail summary, never goals or notes
}

export interface ExchangeState {
  readonly revision: number;
  readonly requests: readonly ExchangeRequest[];
  readonly quotes: readonly ExchangeQuote[];
  readonly advice: readonly ExchangeAdvice[];
  readonly supportNotes: readonly ExchangeSupportNote[];
  readonly events: readonly ExchangeAudit[];
  readonly consumedIds: readonly string[];
}

type Base = {
  readonly commandId: string;
  readonly expectedRevision: number;
  readonly actorId: ExchangeActorId;
};
export type ExchangeCommand =
  | (Base & { readonly type: "create_request"; readonly offerId: string; readonly goal: string })
  | (Base & { readonly type: "grant"; readonly requestId: string; readonly recipient: ExchangeActorId; readonly expiresOn: string })
  | (Base & { readonly type: "revoke"; readonly requestId: string; readonly grantId: string })
  | (Base & { readonly type: "propose_quote"; readonly requestId: string; readonly parts: QuoteParts; readonly terms: string })
  | (Base & { readonly type: "shortlist_quote"; readonly requestId: string; readonly quoteId: string })
  | (Base & { readonly type: "decline_quote"; readonly requestId: string; readonly quoteId: string })
  | (Base & { readonly type: "withdraw_quote"; readonly requestId: string; readonly quoteId: string })
  | (Base & { readonly type: "add_advice"; readonly requestId: string; readonly text: string })
  | (Base & { readonly type: "add_support_note"; readonly requestId: string; readonly text: string })
  | (Base & { readonly type: "close_request"; readonly requestId: string });

/** Role-specific payloads only; real auth must come from a trusted server. */
export type ExchangeIntent = ExchangeCommand extends infer T
  ? T extends ExchangeCommand ? Omit<T, "commandId" | "expectedRevision"> : never
  : never;

export const EMPTY_EXCHANGE: ExchangeState = {
  revision: 0, requests: [], quotes: [], advice: [], supportNotes: [],
  events: [], consumedIds: [],
};

function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function actorFor(id: ExchangeActorId) {
  const actor = DEMO_ACTORS[id];
  ensure(Boolean(actor), "Unknown example actor.");
  return actor;
}
function requestFor(state: ExchangeState, id: string): ExchangeRequest {
  const request = state.requests.find((entry) => entry.id === id);
  ensure(request, "Unknown enquiry.");
  return request;
}
function openRequest(state: ExchangeState, id: string): ExchangeRequest {
  const request = requestFor(state, id);
  ensure(request.status !== "closed", "This enquiry is closed. Open a new enquiry.");
  return request;
}
function participantOnly(actorId: ExchangeActorId): void {
  ensure(actorId === "participant", "Only the participant can make this choice.");
}
function textWithin(text: string, min: number, max: number, label: string): string {
  ensure(typeof text === "string", label + " is required.");
  const clean = text.trim();
  ensure(clean.length >= min && clean.length <= max, label + " must contain " + min + "–" + max + " characters.");
  ensure(!/[\u0000-\u001F]/.test(clean), label + " must be one plain-text line.");
  return clean;
}
function validateISODate(raw: string): number {
  ensure(/^\d{4}-\d{2}-\d{2}$/.test(raw), "Invalid ISO date.");
  const value = Date.parse(raw + "T00:00:00Z");
  ensure(Number.isFinite(value) && new Date(value).toISOString().slice(0, 10) === raw, "Invalid calendar date.");
  return value;
}
function validateGrantExpiry(expiresOn: string, today: string): void {
  const start = validateISODate(today);
  const end = validateISODate(expiresOn);
  ensure(end >= start, "The permission expiry cannot be in the past.");
  ensure(end - start <= 90 * 86_400_000, "Grant permissions for no more than 90 days.");
}
function scopeForRecipient(id: ExchangeActorId): ExchangeGrantScope {
  const role = actorFor(id).role;
  if (role === "advisor") return "advice";
  if (role === "coordinator") return "support";
  if (role === "supplier" || role === "provider") return "quote";
  throw new Error("You cannot delegate this permission to a participant.");
}
export function sellerCanOffer(offer: CommerceOffer, sellerId: ExchangeActorId): boolean {
  const role = actorFor(sellerId).role;
  return offer.kind === "service" ? role === "provider" : role === "supplier";
}
function grantValid(
  request: ExchangeRequest,
  recipient: ExchangeActorId,
  scope: ExchangeGrantScope,
  today: string,
): boolean {
  validateISODate(today);
  return request.grants.some((g) =>
    g.active && g.recipient === recipient && g.scope === scope && g.expiresOn >= today);
}
function assertGrant(request: ExchangeRequest, actorId: ExchangeActorId,
  scope: ExchangeGrantScope, today: string): void {
  ensure(grantValid(request, actorId, scope, today),
    "The participant has not granted an active permission for this action.");
}
function findQuote(state: ExchangeState, requestId: string, quoteId: string): ExchangeQuote {
  const quote = state.quotes.find((entry) => entry.id === quoteId && entry.requestId === requestId);
  ensure(quote, "This quotation does not belong to the enquiry.");
  return quote;
}
export function quoteTotal(parts: QuoteParts): number {
  const values = [parts.itemCents, parts.deliveryCents, parts.installationCents, parts.trainingCents];
  ensure(values.every((value) => Number.isSafeInteger(value) && value >= 0 && value <= 10_000_000),
    "Each quote amount must be between zero and $100,000 in whole cents.");
  ensure(parts.itemCents > 0, "An item or service quote amount is required.");
  const total = values.reduce((sum, value) => sum + value, 0);
  ensure(total <= 20_000_000, "The example total exceeds the demonstration limit.");
  return total;
}
export type AtCostBand = "low" | "mid" | "high";
export function atCostBand(priceCents: number): AtCostBand {
  ensure(Number.isSafeInteger(priceCents) && priceCents >= 0, "A valid cent amount is required.");
  if (priceCents < 150_000) return "low";
  if (priceCents <= 1_500_000) return "mid";
  return "high";
}
export function getVisibleRequests(
  state: ExchangeState,
  actorId: ExchangeActorId,
  today: string,
): ExchangeRequest[] {
  actorFor(actorId);
  if (actorId === "participant") return [...state.requests];
  const role = DEMO_ACTORS[actorId].role;
  return state.requests.filter((request) => request.status !== "closed" &&
    grantValid(request, actorId, role === "advisor" ? "advice" :
      role === "coordinator" ? "support" : "quote", today));
}
export function getVisibleQuotes(
  state: ExchangeState, request: ExchangeRequest, actorId: ExchangeActorId, today: string,
): ExchangeQuote[] {
  const role = actorFor(actorId).role;
  if (actorId === "participant") return state.quotes.filter((quote) => quote.requestId === request.id);
  if ((role === "supplier" || role === "provider") && grantValid(request, actorId, "quote", today))
    return state.quotes.filter((quote) => quote.requestId === request.id && quote.sellerId === actorId);
  return []; // advisors/coordinators never see seller prices by default
}
export function getVisibleAdvice(
  state: ExchangeState, request: ExchangeRequest, actorId: ExchangeActorId, today: string,
): ExchangeAdvice[] {
  if (actorId === "participant") return state.advice.filter((note) => note.requestId === request.id);
  if (actorId === "independentAdvisor" && grantValid(request, actorId, "advice", today))
    return state.advice.filter((note) => note.requestId === request.id && note.advisorId === actorId);
  return [];
}
export function getVisibleSupportNotes(
  state: ExchangeState, request: ExchangeRequest, actorId: ExchangeActorId, today: string,
): ExchangeSupportNote[] {
  if (actorId === "participant") return state.supportNotes.filter((note) => note.requestId === request.id);
  if (actorId === "coordinator" && grantValid(request, actorId, "support", today))
    return state.supportNotes.filter((note) => note.requestId === request.id);
  return [];
}

/** Deterministic, immutable state reducer for synthetic tests, not a payment or auth service. */
export function applyExchangeCommand(
  state: ExchangeState,
  command: ExchangeCommand,
  today: string,
): ExchangeState {
  validateISODate(today);
  ensure(typeof command.commandId === "string" &&
    /^[a-z0-9][a-z0-9-]{5,72}$/.test(command.commandId), "Invalid command identifier.");
  if (state.consumedIds.includes(command.commandId)) return state; // explicit idempotent replay
  ensure(command.expectedRevision === state.revision, "This view is stale; refresh before changing the enquiry.");
  actorFor(command.actorId);
  ensure(state.requests.length < 50 || command.type !== "create_request", "The demonstration enquiry limit has been reached.");
  let requests = state.requests;
  let quotes = state.quotes;
  let advice = state.advice;
  let supportNotes = state.supportNotes;
  let requestId = "";
  let eventKind: ExchangeActionKind;
  let summary: string;

  switch (command.type) {
    case "create_request": {
      participantOnly(command.actorId);
      const item = getCommerceOffer(command.offerId);
      ensure(item && item.route !== "unavailable", "This equipment cannot be requested in the demo.");
      const goal = textWithin(command.goal, 10, 200, "Your enquiry description");
      requestId = "request-" + (state.requests.length + 1);
      requests = [...requests, { id: requestId, offerId: item.id, goal,
        owner: "participant", status: "draft", grants: [] }];
      eventKind = "request.created"; summary = "Participant prepared a private example request.";
      break;
    }
    case "grant": {
      participantOnly(command.actorId);
      const request = openRequest(state, command.requestId);
      requestId = request.id;
      const scope = scopeForRecipient(command.recipient);
      const offer = getCommerceOffer(request.offerId);
      ensure(offer, "Offer reference is missing.");
      if (scope === "quote")
        ensure(sellerCanOffer(offer, command.recipient), "Selected organisation cannot quote for this offering type.");
      validateGrantExpiry(command.expiresOn, today);
      ensure(!request.grants.some((grant) => grant.recipient === command.recipient && grant.active),
        "The organisation already has an active grant; revoke it before changing permissions.");
      const grant: ExchangeGrant = {
        id: "grant-" + (state.revision + 1), requestId, recipient: command.recipient,
        scope, expiresOn: command.expiresOn, active: true,
      };
      requests = state.requests.map((entry) => entry.id === requestId
        ? { ...entry, status: "shared", grants: [...entry.grants, grant] } : entry);
      eventKind = "grant.created"; summary = "Participant shared limited example information with a selected role.";
      break;
    }
    case "revoke": {
      participantOnly(command.actorId);
      const request = openRequest(state, command.requestId);
      requestId = request.id;
      const grant = request.grants.find((g) => g.id === command.grantId);
      ensure(grant && grant.active, "No active permission matches that request.");
      requests = state.requests.map((entry) => entry.id === requestId
        ? { ...entry, grants: entry.grants.map((g) => g.id === command.grantId
          ? { ...g, active: false } : g) } : entry);
      eventKind = "grant.revoked"; summary = "Participant withdrew an example information-sharing permission.";
      break;
    }
    case "propose_quote": {
      const request = openRequest(state, command.requestId);
      requestId = request.id;
      ensure(request.status === "shared", "The participant must share the enquiry first.");
      const offer = getCommerceOffer(request.offerId);
      ensure(offer && sellerCanOffer(offer, command.actorId),
        "Only an appropriately scoped supplier or service provider can propose this quote.");
      assertGrant(request, command.actorId, "quote", today);
      ensure(state.quotes.filter((q) => q.requestId === requestId).length < 6,
        "This example enquiry has reached its quotation limit.");
      ensure(!state.quotes.some((q) => q.requestId === requestId &&
        q.sellerId === command.actorId && (q.status === "proposed" || q.status === "shortlisted")),
        "An active quotation from this organisation already exists.");
      const amount = quoteTotal(command.parts);
      const terms = textWithin(command.terms, 12, 260, "Illustrative quote terms");
      quotes = [...quotes, {
        id: "quote-" + (state.quotes.length + 1),
        requestId, sellerId: command.actorId, parts: { ...command.parts },
        totalCents: amount, terms, status: "proposed",
        gstStatus: "not_reviewed", fundingStatus: "not_assessed",
        supplierEvidenceStatus: "not_verified",
      }];
      eventKind = "quote.proposed"; summary = "Example seller prepared a nonbinding quotation.";
      break;
    }
    case "shortlist_quote":
    case "decline_quote": {
      participantOnly(command.actorId);
      const request = openRequest(state, command.requestId);
      requestId = request.id;
      const quote = findQuote(state, requestId, command.quoteId);
      ensure(quote.status === "proposed", "Only an active draft proposal can be selected or declined.");
      quotes = state.quotes.map((q) => q.id === quote.id
        ? { ...q, status: command.type === "shortlist_quote" ? "shortlisted" : "declined" } : q);
      eventKind = command.type === "shortlist_quote" ? "quote.shortlisted" : "quote.declined";
      summary = command.type === "shortlist_quote"
        ? "Participant saved this proposal for discussion; no purchase was authorised."
        : "Participant declined a proposed example quote.";
      break;
    }
    case "withdraw_quote": {
      const request = openRequest(state, command.requestId);
      requestId = request.id;
      const quote = findQuote(state, requestId, command.quoteId);
      ensure(quote.sellerId === command.actorId, "Only the originating seller can withdraw their proposal.");
      assertGrant(request, command.actorId, "quote", today);
      ensure(quote.status === "proposed" || quote.status === "shortlisted",
        "This proposal is not open for withdrawal.");
      quotes = state.quotes.map((q) => q.id === quote.id
        ? { ...q, status: "withdrawn" } : q);
      eventKind = "quote.withdrawn"; summary = "The example supplier withdrew a quote.";
      break;
    }
    case "add_advice": {
      const request = openRequest(state, command.requestId);
      requestId = request.id;
      ensure(command.actorId === "independentAdvisor",
        "Only the independently invited example advisor can provide a planning note.");
      assertGrant(request, command.actorId, "advice", today);
      const value = textWithin(command.text, 12, 240, "Planning considerations");
      ensure(state.advice.filter((a) => a.requestId === requestId).length < 4,
        "This example has reached its advisory-note limit.");
      advice = [...advice, {
        id: "advice-" + (state.advice.length + 1),
        requestId, advisorId: "independentAdvisor", text: value,
        evidenceStatus: "simulation_only_not_a_clinical_assessment",
      }];
      eventKind = "advisor.note_added";
      summary = "An illustrative non-clinical advisory consideration was added.";
      break;
    }
    case "add_support_note": {
      const request = openRequest(state, command.requestId);
      requestId = request.id;
      ensure(command.actorId === "coordinator",
        "Only a chosen example coordinator can prepare this support note.");
      assertGrant(request, command.actorId, "support", today);
      const value = textWithin(command.text, 12, 240, "Coordinator planning note");
      ensure(state.supportNotes.filter((a) => a.requestId === requestId).length < 4,
        "This example has reached its support-note limit.");
      supportNotes = [...supportNotes, {
        id: "support-" + (state.supportNotes.length + 1),
        requestId, coordinatorId: "coordinator", text: value,
        authority: "assistance_only_no_purchase_authority",
      }];
      eventKind = "coordinator.note_added";
      summary = "Example coordinator helped prepare information without approval authority.";
      break;
    }
    case "close_request": {
      participantOnly(command.actorId);
      const request = openRequest(state, command.requestId);
      requestId = request.id;
      requests = state.requests.map((entry) => entry.id === requestId
        ? { ...entry, status: "closed",
          grants: entry.grants.map((g) => ({ ...g, active: false })) } : entry);
      eventKind = "request.closed"; summary = "Participant closed this example request and revoked sharing.";
      break;
    }
  }

  return {
    revision: state.revision + 1,
    requests, quotes, advice, supportNotes,
    consumedIds: [...state.consumedIds, command.commandId],
    events: [...state.events, {
      sequence: state.revision + 1, actorId: command.actorId,
      kind: eventKind, requestId, summary,
    }],
  };
}

export function formatExampleDay(daysFromToday: number, today: string): string {
  const start = validateISODate(today);
  ensure(Number.isInteger(daysFromToday) && daysFromToday >= 0 && daysFromToday <= 90,
    "Expiry interval must be within the demonstration window.");
  return new Date(start + daysFromToday * 86_400_000).toISOString().slice(0, 10);
}

/** Starter data is fictional; repeatable lifecycle events are generated through the same policy. */
export function makeSyntheticExchange(today: string): ExchangeState {
  let state = EMPTY_EXCHANGE;
  let index = 0;
  const run = (payload: ExchangeIntent): void => {
    state = applyExchangeCommand(state, {
      ...payload, commandId: "synthetic-" + (++index), expectedRevision: state.revision,
    } as ExchangeCommand, today);
  };
  run({ type: "create_request", actorId: "participant", offerId: "demo-chair",
    goal: "Compare safe assessment, fitting and trial options for this example wheelchair." });
  run({ type: "grant", actorId: "participant", requestId: "request-1",
    recipient: "supplierBlue", expiresOn: formatExampleDay(30, today) });
  run({ type: "grant", actorId: "participant", requestId: "request-1",
    recipient: "independentAdvisor", expiresOn: formatExampleDay(30, today) });
  run({ type: "propose_quote", actorId: "supplierBlue", requestId: "request-1",
    parts: { itemCents: 1_750_000, deliveryCents: 18_000,
      installationCents: 26_000, trainingCents: 12_000 },
    terms: "Example item, delivery and fitting terms. Exact equipment and safety details unverified." });
  run({ type: "add_advice", actorId: "independentAdvisor", requestId: "request-1",
    text: "A qualified assessment and an equipment trial would need to be arranged. No clinical assessment has occurred in this demonstration." });
  run({ type: "create_request", actorId: "participant", offerId: "demo-training",
    goal: "Compare accessible AAC training formats, length and communication options." });
  run({ type: "grant", actorId: "participant", requestId: "request-2",
    recipient: "providerLearning", expiresOn: formatExampleDay(30, today) });
  run({ type: "grant", actorId: "participant", requestId: "request-2",
    recipient: "coordinator", expiresOn: formatExampleDay(30, today) });
  run({ type: "propose_quote", actorId: "providerLearning", requestId: "request-2",
    parts: { itemCents: 18_000, deliveryCents: 0, installationCents: 0, trainingCents: 0 },
    terms: "Illustrative remote training session; accessibility and availability not confirmed." });
  return state;
}
