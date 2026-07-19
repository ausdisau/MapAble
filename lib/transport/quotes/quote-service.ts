/**
 * First-class transport quotes (Prisma-persisted with immutable versions).
 * Versioned, expiring, with accessibility/vehicle assumptions and funding disclaimer.
 * Never implies NDIS funding approval or guaranteed ETA.
 * Exact address disclosure remains gated by location-disclosure stages after acceptance.
 */

import type { TransportQuoteStatus as PrismaQuoteStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import {
  locationStageForQuoteStatus,
  type LocationDisclosureStage,
} from "@/lib/transport/privacy/location-disclosure";

export type TransportQuoteStatus =
  | "proposed"
  | "accepted"
  | "rejected"
  | "expired"
  | "amended"
  | "cancelled";

export type TransportQuoteComponent = {
  code: string;
  label: string;
  amountCents: number;
};

export type TransportQuote = {
  id: string;
  version: number;
  tripRequestId?: string;
  organisationId: string;
  participantUserId: string;
  status: TransportQuoteStatus;
  currency: "AUD";
  components: TransportQuoteComponent[];
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
  /** Location disclosure stage implied by quote status (never unlocks exact address alone for providers). */
  locationStage: LocationDisclosureStage;
};

export const FUNDING_DISCLAIMER =
  "This quote is not NDIS funding approval. Plan managers and participants remain responsible for funding decisions.";

const DEFAULT_CANCELLATION =
  "Cancellation terms are provider-specific and confirmed at acceptance.";

type QuoteRow = {
  id: string;
  organisationId: string;
  participantUserId: string;
  tripRequestId: string | null;
  currentVersion: number;
  status: PrismaQuoteStatus;
  providerLabel: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  versions: Array<{
    version: number;
    currency: string;
    components: unknown;
    totalCents: number;
    vehicleAssumptions: unknown;
    accessibilityAssumptions: unknown;
    exclusions: unknown;
    fundingDisclaimer: string;
    cancellationPolicy: string;
  }>;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function asComponents(value: unknown): TransportQuoteComponent[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      if (
        typeof r.code !== "string" ||
        typeof r.label !== "string" ||
        typeof r.amountCents !== "number"
      ) {
        return null;
      }
      return {
        code: r.code,
        label: r.label,
        amountCents: r.amountCents,
      };
    })
    .filter((c): c is TransportQuoteComponent => c !== null);
}

function toDto(row: QuoteRow): TransportQuote {
  const versionRow =
    row.versions.find((v) => v.version === row.currentVersion) ??
    row.versions[0];
  if (!versionRow) {
    throw new Error("QUOTE_VERSION_MISSING");
  }
  return {
    id: row.id,
    version: versionRow.version,
    tripRequestId: row.tripRequestId ?? undefined,
    organisationId: row.organisationId,
    participantUserId: row.participantUserId,
    status: row.status as TransportQuoteStatus,
    currency: "AUD",
    components: asComponents(versionRow.components),
    totalCents: versionRow.totalCents,
    vehicleAssumptions: asStringArray(versionRow.vehicleAssumptions),
    accessibilityAssumptions: asStringArray(
      versionRow.accessibilityAssumptions,
    ),
    exclusions: asStringArray(versionRow.exclusions),
    fundingDisclaimer: versionRow.fundingDisclaimer,
    cancellationPolicy: versionRow.cancellationPolicy,
    providerLabel: row.providerLabel,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    acceptedAt: row.acceptedAt?.toISOString(),
    rejectedAt: row.rejectedAt?.toISOString(),
    locationStage: locationStageForQuoteStatus(
      row.status as TransportQuoteStatus,
    ),
  };
}

const versionInclude = {
  versions: { orderBy: { version: "desc" as const } },
};

async function loadQuote(id: string): Promise<QuoteRow | null> {
  return prisma.transportQuote.findUnique({
    where: { id },
    include: versionInclude,
  });
}

async function expireIfNeeded(row: QuoteRow): Promise<QuoteRow> {
  if (
    (row.status === "proposed" || row.status === "amended") &&
    row.expiresAt.getTime() <= Date.now()
  ) {
    const updated = await prisma.transportQuote.update({
      where: { id: row.id },
      data: { status: "expired" },
      include: versionInclude,
    });
    return updated;
  }
  return row;
}

export async function createTransportQuote(input: {
  organisationId: string;
  participantUserId: string;
  tripRequestId?: string;
  components: TransportQuoteComponent[];
  vehicleAssumptions?: string[];
  accessibilityAssumptions?: string[];
  exclusions?: string[];
  providerLabel: string;
  ttlMinutes?: number;
  actorUserId?: string;
}): Promise<TransportQuote> {
  const now = new Date();
  const ttl = Math.min(Math.max(input.ttlMinutes ?? 60, 5), 24 * 60);
  const totalCents = input.components.reduce((s, c) => s + c.amountCents, 0);
  const exclusions =
    input.exclusions ?? ["Live ETA", "Guaranteed accessible route"];

  const created = await prisma.$transaction(async (tx) => {
    const quote = await tx.transportQuote.create({
      data: {
        organisationId: input.organisationId,
        participantUserId: input.participantUserId,
        tripRequestId: input.tripRequestId,
        currentVersion: 1,
        status: "proposed",
        providerLabel: input.providerLabel,
        expiresAt: new Date(now.getTime() + ttl * 60_000),
        versions: {
          create: {
            version: 1,
            currency: "AUD",
            components: input.components,
            totalCents,
            vehicleAssumptions: input.vehicleAssumptions ?? [],
            accessibilityAssumptions: input.accessibilityAssumptions ?? [],
            exclusions,
            fundingDisclaimer: FUNDING_DISCLAIMER,
            cancellationPolicy: DEFAULT_CANCELLATION,
          },
        },
      },
      include: versionInclude,
    });
    return quote;
  });

  await createAuditEvent({
    actorUserId: input.actorUserId ?? input.participantUserId,
    action: "transport_quote.created",
    entityType: "TransportQuote",
    entityId: created.id,
    organisationId: created.organisationId,
    participantId: created.participantUserId,
    metadata: {
      version: created.currentVersion,
      tripRequestId: created.tripRequestId,
      // Never log exact addresses on quote create
    },
  });

  return toDto(created);
}

export async function getTransportQuote(
  id: string,
): Promise<TransportQuote | null> {
  const row = await loadQuote(id);
  if (!row) return null;
  return toDto(await expireIfNeeded(row));
}

/**
 * Tenant-aware read: participant owns quote, or caller asserts org match.
 * Cross-tenant → null (404), not 403.
 */
export async function getTransportQuoteForAccess(input: {
  quoteId: string;
  participantUserId?: string;
  organisationId?: string;
}): Promise<TransportQuote | null> {
  const quote = await getTransportQuote(input.quoteId);
  if (!quote) return null;
  if (
    input.participantUserId &&
    quote.participantUserId === input.participantUserId
  ) {
    return quote;
  }
  if (
    input.organisationId &&
    quote.organisationId === input.organisationId
  ) {
    return quote;
  }
  return null;
}

export async function acceptTransportQuote(input: {
  quoteId: string;
  participantUserId: string;
}): Promise<TransportQuote> {
  const row = await loadQuote(input.quoteId);
  if (!row) throw new Error("NOT_FOUND");
  const current = await expireIfNeeded(row);
  if (current.participantUserId !== input.participantUserId) {
    throw new Error("FORBIDDEN");
  }
  if (current.status === "expired") throw new Error("EXPIRED");
  if (current.status === "accepted") {
    return toDto(current);
  }
  if (current.status !== "proposed" && current.status !== "amended") {
    throw new Error("INVALID_STATE");
  }

  const updated = await prisma.transportQuote.update({
    where: { id: current.id },
    data: {
      status: "accepted",
      acceptedAt: new Date(),
    },
    include: versionInclude,
  });

  await createAuditEvent({
    actorUserId: input.participantUserId,
    action: "transport_quote.accepted",
    entityType: "TransportQuote",
    entityId: updated.id,
    organisationId: updated.organisationId,
    participantId: updated.participantUserId,
    metadata: { version: updated.currentVersion },
  });

  return toDto(updated);
}

export async function rejectTransportQuote(input: {
  quoteId: string;
  participantUserId: string;
}): Promise<TransportQuote> {
  const row = await loadQuote(input.quoteId);
  if (!row) throw new Error("NOT_FOUND");
  if (row.participantUserId !== input.participantUserId) {
    throw new Error("FORBIDDEN");
  }
  const current = await expireIfNeeded(row);
  if (current.status === "accepted") throw new Error("INVALID_STATE");

  const updated = await prisma.transportQuote.update({
    where: { id: current.id },
    data: {
      status: "rejected",
      rejectedAt: new Date(),
    },
    include: versionInclude,
  });

  await createAuditEvent({
    actorUserId: input.participantUserId,
    action: "transport_quote.rejected",
    entityType: "TransportQuote",
    entityId: updated.id,
    organisationId: updated.organisationId,
    participantId: updated.participantUserId,
    metadata: { version: updated.currentVersion },
  });

  return toDto(updated);
}
