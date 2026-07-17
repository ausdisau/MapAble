/**
 * First-class transport quotes (process-local until Prisma Prompt 2 lands).
 * Versioned, expiring, with accessibility/vehicle assumptions and funding disclaimer.
 * Never implies NDIS funding approval or guaranteed ETA.
 */

export type TransportQuoteStatus =
  | "proposed"
  | "accepted"
  | "rejected"
  | "expired"
  | "amended"
  | "cancelled";

export type TransportQuote = {
  id: string;
  version: number;
  tripRequestId?: string;
  organisationId: string;
  participantUserId: string;
  status: TransportQuoteStatus;
  currency: "AUD";
  components: Array<{ code: string; label: string; amountCents: number }>;
  totalCents: number;
  vehicleAssumptions: string[];
  accessibilityAssumptions: string[];
  exclusions: string[];
  fundingDisclaimer: string;
  cancellationPolicy: string;
  providerLabel: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
};

const quotes = new Map<string, TransportQuote>();

const FUNDING_DISCLAIMER =
  "This quote is not NDIS funding approval. Plan managers and participants remain responsible for funding decisions.";

export function createTransportQuote(input: {
  organisationId: string;
  participantUserId: string;
  tripRequestId?: string;
  components: TransportQuote["components"];
  vehicleAssumptions?: string[];
  accessibilityAssumptions?: string[];
  exclusions?: string[];
  providerLabel: string;
  ttlMinutes?: number;
}): TransportQuote {
  const now = new Date();
  const ttl = Math.min(Math.max(input.ttlMinutes ?? 60, 5), 24 * 60);
  const totalCents = input.components.reduce((s, c) => s + c.amountCents, 0);
  const quote: TransportQuote = {
    id: `tq_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    version: 1,
    tripRequestId: input.tripRequestId,
    organisationId: input.organisationId,
    participantUserId: input.participantUserId,
    status: "proposed",
    currency: "AUD",
    components: input.components,
    totalCents,
    vehicleAssumptions: input.vehicleAssumptions ?? [],
    accessibilityAssumptions: input.accessibilityAssumptions ?? [],
    exclusions: input.exclusions ?? ["Live ETA", "Guaranteed accessible route"],
    fundingDisclaimer: FUNDING_DISCLAIMER,
    cancellationPolicy:
      "Cancellation terms are provider-specific and confirmed at acceptance.",
    providerLabel: input.providerLabel,
    expiresAt: new Date(now.getTime() + ttl * 60_000).toISOString(),
    createdAt: now.toISOString(),
  };
  quotes.set(quote.id, quote);
  return quote;
}

export function getTransportQuote(id: string): TransportQuote | null {
  const q = quotes.get(id);
  if (!q) return null;
  if (q.status === "proposed" && Date.parse(q.expiresAt) <= Date.now()) {
    const expired = { ...q, status: "expired" as const };
    quotes.set(id, expired);
    return expired;
  }
  return q;
}

export function acceptTransportQuote(input: {
  quoteId: string;
  participantUserId: string;
}): TransportQuote {
  const q = getTransportQuote(input.quoteId);
  if (!q) throw new Error("NOT_FOUND");
  if (q.participantUserId !== input.participantUserId) {
    throw new Error("FORBIDDEN");
  }
  if (q.status === "expired") throw new Error("EXPIRED");
  if (q.status !== "proposed" && q.status !== "amended") {
    throw new Error("INVALID_STATE");
  }
  const next = {
    ...q,
    status: "accepted" as const,
    acceptedAt: new Date().toISOString(),
  };
  quotes.set(q.id, next);
  return next;
}

export function rejectTransportQuote(input: {
  quoteId: string;
  participantUserId: string;
}): TransportQuote {
  const q = getTransportQuote(input.quoteId);
  if (!q) throw new Error("NOT_FOUND");
  if (q.participantUserId !== input.participantUserId) {
    throw new Error("FORBIDDEN");
  }
  const next = {
    ...q,
    status: "rejected" as const,
    rejectedAt: new Date().toISOString(),
  };
  quotes.set(q.id, next);
  return next;
}

/** Test helper */
export function __resetTransportQuotesForTests(): void {
  quotes.clear();
}
