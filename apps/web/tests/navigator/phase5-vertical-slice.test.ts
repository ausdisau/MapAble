import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/consent/consent-receipt-service", () => ({
  createConsentReceipt: vi.fn(async (input: { action: string }) => ({
    id: `receipt-${input.action}`,
  })),
}));

vi.mock("@/lib/authority/participant-authority-service", () => ({
  hasParticipantAuthority: vi.fn(async () => false),
}));

vi.mock("@/lib/ingestion/ndis-providers-search", () => ({
  searchNdisProviders: vi.fn(),
}));

vi.mock("@/lib/search/interpreter", () => ({
  interpretSearchQuery: vi.fn(async (query: string) => ({
    sourceQuery: query,
    parsed: true,
    configured: false,
    filters: {
      q: query,
      location: "Parramatta",
      access: "",
      service: "support worker",
      provider: "",
    },
    serviceCategorySlug: null,
    serviceCategoryId: null,
    accessNeedIds: [],
    accessNeeds: { ids: [], confidence: 0, source: "none" as const },
    confidence: 0.6,
    engineId: "rules/test",
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: {
      findMany: vi.fn(),
    },
    governedActionEnvelope: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    navigatorDecisionPassport: {
      create: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  approveGovernedActionEnvelope,
  updateGovernedActionEnvelopeDraft,
} from "@/lib/ai/navigator/envelopes/service";
import { materialiseFinderTransfer } from "@/lib/ai/navigator/finder-transfer";
import { hardConstraintsSchema } from "@/lib/ai/navigator/matching/types";
import { runNavigatorProviderSearchTurn } from "@/lib/ai/navigator/orchestrator";
import { NAVIGATOR_CONSENT_PURPOSE } from "@/lib/ai/navigator/consent-gate";
import {
  getProviderFinderSession,
  resetProviderFinderSessionsForTests,
} from "@/lib/ai/agent-sessions/provider-finder-session";
import { searchNdisProviders } from "@/lib/ingestion/ndis-providers-search";
import { prisma } from "@/lib/prisma";

const FLAG_KEYS = [
  "MAPABLE_NAVIGATOR_PILOT_ENABLED",
  "MAPABLE_NAVIGATOR_PILOT_MODEL_ASSISTED",
  "MAPABLE_NAVIGATOR_PILOT_ENVELOPES",
  "MAPABLE_NAVIGATOR_PILOT_PASSPORT",
  "MAPABLE_NAVIGATOR_PILOT_MEMORY",
  "MAPABLE_NAVIGATOR_PILOT_MATCHING",
] as const;

function enableSliceFlags() {
  process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED = "true";
  process.env.MAPABLE_NAVIGATOR_PILOT_ENVELOPES = "true";
  process.env.MAPABLE_NAVIGATOR_PILOT_MATCHING = "true";
  process.env.MAPABLE_NAVIGATOR_PILOT_PASSPORT = "true";
}

function clearFlags() {
  for (const key of FLAG_KEYS) delete process.env[key];
}

function mockActiveConsent() {
  vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
    {
      id: "c-ok",
      purpose: NAVIGATOR_CONSENT_PURPOSE,
      status: "active",
      expiryDate: new Date(Date.now() + 60_000),
      dataScope: ["location", "serviceType", "accessibility", "communication"],
      sourceAction: "*",
      createdAt: new Date(),
    } as never,
  ]);
}

/**
 * Prisma model methods return a thenable client with relation getters
 * (`participant`, `initiatingUser`). Plain Promise.resolve(row) is not
 * assignable — attach compatible stubs so mocks type-check.
 */
function prismaEnvelopeResult<T extends object>(row: T) {
  const result = Promise.resolve(row) as unknown as Promise<T> & {
    participant: Promise<null>;
    initiatingUser: Promise<null>;
  };
  result.participant = Promise.resolve(null);
  result.initiatingUser = Promise.resolve(null);
  return result;
}

describe("Navigator Phase 5 — vertical slice closure", () => {
  beforeEach(() => {
    clearFlags();
    resetProviderFinderSessionsForTests();
    vi.mocked(searchNdisProviders).mockReset();
    vi.mocked(prisma.governedActionEnvelope.create).mockReset();
    vi.mocked(prisma.governedActionEnvelope.findFirst).mockReset();
    vi.mocked(prisma.governedActionEnvelope.update).mockReset();
    vi.mocked(prisma.governedActionEnvelope.updateMany).mockReset();
    vi.mocked(prisma.governedActionEnvelope.findUniqueOrThrow).mockReset();
    vi.mocked(prisma.navigatorDecisionPassport.create).mockReset();
    vi.mocked(createAuditEvent).mockClear();
    mockActiveConsent();
  });

  afterEach(() => {
    clearFlags();
    resetProviderFinderSessionsForTests();
  });

  it("materialises Finder transfer URL and session filters", () => {
    const transfer = materialiseFinderTransfer({
      payload: {
        query: "support worker",
        location: "Parramatta",
        serviceQuery: "support worker",
        accessQuery: "wheelchair",
      },
      sessionId: "nav-transfer-test-1",
    });

    expect(transfer.finderPath).toContain("/provider-finder?");
    expect(transfer.finderPath).toContain("q=support");
    expect(transfer.finderPath).toContain("location=Parramatta");
    expect(transfer.finderPath).toContain("from=navigator-pilot");
    expect(transfer.finderPath).toContain("sessionId=nav-transfer-test-1");

    const session = getProviderFinderSession("nav-transfer-test-1");
    expect(session?.cumulativeApplied?.serviceQuery).toBe("support worker");
    expect(session?.cumulativeApplied?.accessQuery).toBe("wheelchair");
  });

  it("parses nonNegotiableKeys on hard constraints", () => {
    const parsed = hardConstraintsSchema.parse({
      serviceType: "support worker",
      state: "NSW",
      nonNegotiableKeys: ["serviceType", "state"],
      requiredServices: [],
      exclusions: [],
      communicationRequirements: [],
      accessibilityRequirements: [],
      credentialRequirements: [],
    });
    expect(parsed.nonNegotiableKeys).toEqual(["serviceType", "state"]);
  });

  it("creates distinct draft and transfer envelopes when both requested", async () => {
    enableSliceFlags();
    vi.mocked(searchNdisProviders).mockResolvedValue({
      providers: [
        {
          source_id: "p1",
          provider_name: "Alpha Supports",
          suburb: "Parramatta",
          state: "NSW",
          postcode: "2150",
          latitude: null,
          longitude: null,
          phone: null,
          email: null,
          website: null,
          services: ["support worker"],
          registration_groups: [],
          updated_at: new Date("2026-01-01"),
        },
      ],
      count: 1,
    });

    let envelopeSeq = 0;
    vi.mocked(prisma.governedActionEnvelope.create).mockImplementation(
      ((args: { data: { action: string; id: string } }) => {
        const data = args.data;
        envelopeSeq += 1;
        return prismaEnvelopeResult({
          id: data.id,
          tenantId: "t1",
          participantId: "p1",
          initiatingUserId: "p1",
          capabilityKey: "navigator.provider_search.draft_service_request",
          action: data.action,
          payloadJson: {},
          payloadHash: "hash",
          evidenceRefs: [],
          sourceRefs: [],
          modelVersion: null,
          promptVersion: null,
          toolVersion: null,
          consentReceiptId: "receipt",
          requiredApproverRole: "participant",
          nonce: `nonce-${envelopeSeq}`,
          status: "proposed",
          approvalReason: null,
          rejectionReason: null,
          executionResult: null,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
          consumedAt: null,
          auditEventIds: [],
          updatedAt: new Date(),
        });
      }) as unknown as typeof prisma.governedActionEnvelope.create,
    );

    vi.mocked(prisma.navigatorDecisionPassport.create).mockResolvedValue({
      id: "passport-1",
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      sessionId: "sess-1",
      goalSummary: "support worker",
      interpretationJson: {},
      hardConstraintsJson: [],
      rankingWeightsJson: {},
      sourcesJson: [],
      shortlistJson: [],
      uncertaintyNotes: [],
      limitationsNotes: [],
      conflictsOfInterest: [],
      aiInvolved: false,
      aiOptedOut: false,
      modelIndependentRules: [],
      nextStep: null,
      nextStepController: "participant",
      consentedPurpose: NAVIGATOR_CONSENT_PURPOSE,
      consentRecordId: "c-ok",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await runNavigatorProviderSearchTurn({
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      sessionId: "sess-1",
      goalText: "support worker in Parramatta",
      structuredFilters: {
        q: "support worker",
        service: "support worker",
        location: "Parramatta",
        state: "NSW",
      },
      hardConstraints: {
        serviceType: "support worker",
        state: "NSW",
        nonNegotiableKeys: ["serviceType", "state"],
        requiredServices: [],
        exclusions: [],
        communicationRequirements: [],
        accessibilityRequirements: [],
        credentialRequirements: [],
      },
      interpretationConfirmed: true,
      aiOptedOut: true,
      permittedFields: ["location", "serviceType"],
      saveDraft: true,
      transferFilters: true,
      silent: true,
    });

    expect(result.status).toBe("matched");
    expect(result.passportId).toBe("passport-1");
    expect(result.draftEnvelopeId).toBeTruthy();
    expect(result.transferEnvelopeId).toBeTruthy();
    expect(result.draftEnvelopeId).not.toBe(result.transferEnvelopeId);
    expect(prisma.governedActionEnvelope.create).toHaveBeenCalledTimes(2);

    const actions = vi
      .mocked(prisma.governedActionEnvelope.create)
      .mock.calls.map(
        (call) => (call[0] as { data: { action: string } }).data.action,
      );
    expect(actions).toContain("create_service_request_draft");
    expect(actions).toContain("transfer_filters_to_finder");
  });

  it("updates draft payload before approval and materialises finder path on approve", async () => {
    enableSliceFlags();

    const envelopeRow = {
      id: "env-transfer-1",
      tenantId: "t1",
      participantId: "p1",
      initiatingUserId: "p1",
      capabilityKey: "navigator.provider_search.draft_service_request",
      action: "transfer_filters_to_finder",
      payloadJson: {
        query: "old",
        location: "Sydney",
        serviceQuery: "support worker",
      },
      payloadHash: "old-hash",
      evidenceRefs: [],
      sourceRefs: [],
      modelVersion: null,
      promptVersion: null,
      toolVersion: null,
      consentReceiptId: "receipt",
      requiredApproverRole: "participant",
      nonce: "nonce-1",
      status: "proposed",
      approvalReason: null,
      rejectionReason: null,
      executionResult: null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      auditEventIds: [],
    };

    vi.mocked(prisma.governedActionEnvelope.findFirst).mockResolvedValue(
      envelopeRow as never,
    );
    vi.mocked(prisma.governedActionEnvelope.update).mockImplementation(
      ((args: { data: Record<string, unknown> }) => {
        const data = args.data;
        return prismaEnvelopeResult({
          ...envelopeRow,
          ...data,
          payloadJson: data.payloadJson ?? envelopeRow.payloadJson,
          payloadHash: data.payloadHash ?? envelopeRow.payloadHash,
          updatedAt: new Date(),
        });
      }) as unknown as typeof prisma.governedActionEnvelope.update,
    );

    const updated = await updateGovernedActionEnvelopeDraft({
      envelopeId: "env-transfer-1",
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      payload: {
        query: "support worker wheelchair",
        location: "Parramatta",
        serviceQuery: "support worker",
        accessQuery: "wheelchair",
      },
    });
    expect(updated.payload.query).toBe("support worker wheelchair");
    expect(updated.payload.location).toBe("Parramatta");

    const editedPayload = {
      query: "support worker wheelchair",
      location: "Parramatta",
      serviceQuery: "support worker",
      accessQuery: "wheelchair",
    };
    vi.mocked(prisma.governedActionEnvelope.findFirst).mockResolvedValue({
      ...envelopeRow,
      payloadJson: editedPayload,
      payloadHash: updated.payloadHash,
    } as never);
    vi.mocked(prisma.governedActionEnvelope.updateMany).mockResolvedValue({
      count: 1,
    } as never);
    vi.mocked(
      prisma.governedActionEnvelope.findUniqueOrThrow,
    ).mockResolvedValue({
      ...envelopeRow,
      status: "executed_draft",
      payloadJson: editedPayload,
      executionResult: {
        draftOnly: true,
        action: "transfer_filters_to_finder",
        finderPath: "/provider-finder?q=support+worker+wheelchair",
      },
      consumedAt: new Date(),
    } as never);

    const approved = await approveGovernedActionEnvelope({
      envelopeId: "env-transfer-1",
      tenantId: "t1",
      participantId: "p1",
      approverUserId: "p1",
      approverRole: "participant",
      consentStillValid: true,
    });

    expect(approved.status).toBe("executed_draft");
    expect(prisma.governedActionEnvelope.updateMany).toHaveBeenCalled();
    const updateArg = vi.mocked(prisma.governedActionEnvelope.updateMany).mock
      .calls[0]?.[0] as {
      data: { executionResult: { finderPath?: string; action?: string } };
    };
    expect(updateArg.data.executionResult.action).toBe(
      "transfer_filters_to_finder",
    );
    expect(updateArg.data.executionResult.finderPath).toContain(
      "/provider-finder?",
    );
    expect(updateArg.data.executionResult.finderPath).toContain("Parramatta");
  });
});
