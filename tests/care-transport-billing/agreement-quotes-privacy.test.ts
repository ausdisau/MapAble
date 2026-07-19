import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    transportQuote: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const { prisma } = await import("@/lib/prisma");
      return fn(prisma);
    }),
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));

import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  acceptTransportQuote,
  createTransportQuote,
  getTransportQuote,
  getTransportQuoteForAccess,
  FUNDING_DISCLAIMER,
} from "@/lib/transport/quotes/quote-service";
import {
  locationStageForQuoteStatus,
  projectLocationForStage,
} from "@/lib/transport/privacy/location-disclosure";

type StoreRow = {
  id: string;
  organisationId: string;
  participantUserId: string;
  tripRequestId: string | null;
  currentVersion: number;
  status: string;
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

describe("persistent transport quotes", () => {
  const store = new Map<string, StoreRow>();

  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();

    vi.mocked(prisma.transportQuote.create).mockImplementation(
      (async ({ data }: { data: Record<string, unknown> }) => {
        const versionCreate = (
          data.versions as { create: Record<string, unknown> }
        ).create;
        const id = `tq_test_${store.size + 1}`;
        const row: StoreRow = {
          id,
          organisationId: data.organisationId as string,
          participantUserId: data.participantUserId as string,
          tripRequestId: (data.tripRequestId as string | undefined) ?? null,
          currentVersion: (data.currentVersion as number) ?? 1,
          status: (data.status as string) ?? "proposed",
          providerLabel: data.providerLabel as string,
          expiresAt: data.expiresAt as Date,
          acceptedAt: null,
          rejectedAt: null,
          createdAt: new Date(),
          versions: [
            {
              version: versionCreate.version as number,
              currency: (versionCreate.currency as string) ?? "AUD",
              components: versionCreate.components,
              totalCents: versionCreate.totalCents as number,
              vehicleAssumptions: versionCreate.vehicleAssumptions ?? [],
              accessibilityAssumptions:
                versionCreate.accessibilityAssumptions ?? [],
              exclusions: versionCreate.exclusions ?? [],
              fundingDisclaimer: versionCreate.fundingDisclaimer as string,
              cancellationPolicy: versionCreate.cancellationPolicy as string,
            },
          ],
        };
        store.set(id, row);
        return structuredClone(row);
      }) as never,
    );

    vi.mocked(prisma.transportQuote.findUnique).mockImplementation(
      (async ({ where }: { where: { id: string } }) => {
        const row = store.get(where.id);
        return row ? structuredClone(row) : null;
      }) as never,
    );

    vi.mocked(prisma.transportQuote.update).mockImplementation(
      (async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => {
        const row = store.get(where.id);
        if (!row) throw new Error("missing");
        Object.assign(row, data);
        store.set(where.id, row);
        return structuredClone(row);
      }) as never,
    );
  });

  it("creates durable versioned quotes with funding disclaimer and accepts for participant", async () => {
    const quote = await createTransportQuote({
      organisationId: "org-a",
      participantUserId: "taylor",
      providerLabel: "Harbour Accessible Transport",
      components: [
        { code: "base", label: "Base fare", amountCents: 4500 },
        { code: "access", label: "Access support", amountCents: 1500 },
      ],
      accessibilityAssumptions: ["WAV vehicle assumed — not guaranteed"],
      actorUserId: "ops-1",
    });
    expect(quote.version).toBe(1);
    expect(quote.totalCents).toBe(6000);
    expect(quote.fundingDisclaimer).toBe(FUNDING_DISCLAIMER);
    expect(quote.fundingDisclaimer.toLowerCase()).toContain("not ndis funding");
    expect(quote.status).toBe("proposed");
    expect(quote.locationStage).toBe("quote");
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "transport_quote.created" }),
    );

    const accepted = await acceptTransportQuote({
      quoteId: quote.id,
      participantUserId: "taylor",
    });
    expect(accepted.status).toBe("accepted");
    expect(accepted.acceptedAt).toBeTruthy();
    expect(accepted.locationStage).toBe("accepted");
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "transport_quote.accepted" }),
    );

    const reloaded = await getTransportQuote(quote.id);
    expect(reloaded?.status).toBe("accepted");
    expect(reloaded?.totalCents).toBe(6000);
  });

  it("expires proposed quotes past expiresAt", async () => {
    const quote = await createTransportQuote({
      organisationId: "org-a",
      participantUserId: "taylor",
      providerLabel: "Provider",
      components: [{ code: "base", label: "Base", amountCents: 100 }],
      ttlMinutes: 5,
    });
    const row = store.get(quote.id)!;
    row.expiresAt = new Date(Date.now() - 1000);
    const expired = await getTransportQuote(quote.id);
    expect(expired?.status).toBe("expired");
  });

  it("hides cross-tenant quote access", async () => {
    const quote = await createTransportQuote({
      organisationId: "org-a",
      participantUserId: "taylor",
      providerLabel: "Provider",
      components: [{ code: "base", label: "Base", amountCents: 100 }],
    });
    const denied = await getTransportQuoteForAccess({
      quoteId: quote.id,
      participantUserId: "other-user",
      organisationId: "org-b",
    });
    expect(denied).toBeNull();

    const allowed = await getTransportQuoteForAccess({
      quoteId: quote.id,
      organisationId: "org-a",
    });
    expect(allowed?.id).toBe(quote.id);
  });

  it("does not unlock exact address for provider on quote acceptance alone", async () => {
    expect(locationStageForQuoteStatus("accepted")).toBe("accepted");
    const view = projectLocationForStage({
      stage: locationStageForQuoteStatus("accepted"),
      suburb: "Pyrmont",
      exactAddress: "1 Harbour St",
      role: "provider",
    });
    expect(view.redacted).toBe(true);
    expect(view.exactAddress).toBeUndefined();
  });
});

describe("location disclosure", () => {
  it("redacts exact address before acceptance for provider/driver", () => {
    const view = projectLocationForStage({
      stage: "quote",
      suburb: "Pyrmont",
      exactAddress: "1 Harbour St",
      role: "provider",
    });
    expect(view.redacted).toBe(true);
    expect(view.exactAddress).toBeUndefined();
    expect(view.label).toBe("Pyrmont");
  });

  it("reveals exact address to assigned driver in service window", () => {
    const view = projectLocationForStage({
      stage: "assigned",
      suburb: "Pyrmont",
      exactAddress: "1 Harbour St",
      role: "driver",
    });
    expect(view.redacted).toBe(false);
    expect(view.exactAddress).toBe("1 Harbour St");
  });
});
