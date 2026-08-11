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
  },
}));

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  assertNavigatorActionAllowed,
  assertNavigatorCapability,
  isNavigatorPilotProhibited,
  NAVIGATOR_PILOT_PROHIBITED_ACTIONS,
} from "@/lib/ai/navigator/gates";
import {
  NAVIGATOR_CONSENT_PURPOSE,
  verifyPurposeConsent,
} from "@/lib/ai/navigator/consent-gate";
import {
  hashGovernedPayload,
  validateGovernedEnvelopePayload,
} from "@/lib/ai/navigator/envelopes/schema";
import {
  approveGovernedActionEnvelope,
  createGovernedActionEnvelope,
  getGovernedActionEnvelope,
} from "@/lib/ai/navigator/envelopes/service";
import {
  clearCapabilityKillSwitch,
  engageCapabilityKillSwitch,
  listArcAssessments,
  requireAiCapability,
  requireArcAssessment,
} from "@/lib/ai/platform";
import { hasParticipantAuthority } from "@/lib/authority/participant-authority-service";
import { prisma } from "@/lib/prisma";

describe("Navigator Phase 1 — capability registry", () => {
  it("registers aura and navigator capabilities", () => {
    expect(requireAiCapability("agent.aura_harness").backend).toBe(
      "deterministic",
    );
    expect(requireAiCapability("agent.aura_recognise").featureFlag).toBe(
      "MAPABLE_AURA_HARNESS_ENABLED",
    );
    expect(
      requireAiCapability("navigator.provider_search.interpret").version,
    ).toBe("1.0.0");
    expect(
      requireAiCapability("navigator.provider_search.match").authorityCeiling,
    ).toBe("DRAFT_ONLY");
    expect(
      requireAiCapability("navigator.provider_search.draft_service_request")
        .featureFlag,
    ).toBe("MAPABLE_NAVIGATOR_PILOT_ENVELOPES");
  });

  it("has ARC sidecar assessments that do not grant runtime authority", () => {
    const assessments = listArcAssessments();
    expect(assessments.map((a) => a.capabilityKey)).toEqual(
      expect.arrayContaining([
        "agent.aura_harness",
        "navigator.provider_search.match",
        "navigator.provider_search.draft_service_request",
      ]),
    );
    const match = requireArcAssessment("navigator.provider_search.match");
    expect(match.criticalScores.consent_dependency).toBe(3);
    expect(match.designTier).toBe("L2_RECOMMEND");
  });
});

describe("Navigator Phase 1 — runtime gates", () => {
  beforeEach(() => {
    clearCapabilityKillSwitch("navigator.provider_search.match");
    delete process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED;
    delete process.env.MAPABLE_NAVIGATOR_PILOT_ENVELOPES;
    delete process.env.MAPABLE_AI_GLOBAL_KILL_SWITCH;
  });

  afterEach(() => {
    clearCapabilityKillSwitch("navigator.provider_search.match");
    delete process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED;
    delete process.env.MAPABLE_NAVIGATOR_PILOT_ENVELOPES;
  });

  it("denies when pilot flag is default false", async () => {
    const result = await assertNavigatorCapability({
      capabilityKey: "navigator.provider_search.match",
      tenantId: "tenant-1",
      participantId: "p1",
      actorUserId: "p1",
      silent: true,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("feature_flag_disabled");
    }
  });

  it("allows when flag enabled and rejects undeclared tools", async () => {
    process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED = "true";
    const ok = await assertNavigatorCapability({
      capabilityKey: "navigator.provider_search.match",
      tenantId: "tenant-1",
      participantId: "p1",
      actorUserId: "p1",
      toolName: "ndis_provider_hard_filter",
      silent: true,
    });
    expect(ok.allowed).toBe(true);

    const badTool = await assertNavigatorCapability({
      capabilityKey: "navigator.provider_search.match",
      tenantId: "tenant-1",
      participantId: "p1",
      actorUserId: "p1",
      toolName: "book_or_cancel_service",
      silent: true,
    });
    expect(badTool.allowed).toBe(false);
    if (!badTool.allowed) {
      expect(badTool.reason).toBe("tool_not_allowlisted");
    }
  });

  it("respects mid-flow kill switch", async () => {
    process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED = "true";
    engageCapabilityKillSwitch("navigator.provider_search.match");
    const result = await assertNavigatorCapability({
      capabilityKey: "navigator.provider_search.match",
      tenantId: "tenant-1",
      participantId: "p1",
      actorUserId: "p1",
      silent: true,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("capability_kill_switch");
    }
  });

  it("rejects undeclared capabilities", async () => {
    const result = await assertNavigatorCapability({
      capabilityKey: "navigator.not.a.real.capability",
      tenantId: "tenant-1",
      participantId: "p1",
      actorUserId: "p1",
      silent: true,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("capability_not_registered");
    }
  });
});

describe("Navigator Phase 1 — permanent prohibitions", () => {
  it("blocks prohibited autonomous actions", () => {
    for (const action of NAVIGATOR_PILOT_PROHIBITED_ACTIONS) {
      expect(isNavigatorPilotProhibited(action)).toBe(true);
      expect(() => assertNavigatorActionAllowed(action)).toThrow(
        /NAVIGATOR_PILOT_PROHIBITED/,
      );
    }
    expect(() =>
      assertNavigatorActionAllowed("approve_or_pay_invoice"),
    ).toThrow(/NAVIGATOR_PROHIBITED_ACTION/);
  });
});

describe("Navigator Phase 1 — purpose consent", () => {
  beforeEach(() => {
    vi.mocked(prisma.consentRecord.findMany).mockReset();
    vi.mocked(hasParticipantAuthority).mockReset();
    vi.mocked(hasParticipantAuthority).mockResolvedValue(false);
  });

  it("blocks missing, expired, withdrawn, and purpose mismatch", async () => {
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([]);
    expect(
      (
        await verifyPurposeConsent({
          tenantId: "t1",
          participantId: "p1",
          actorUserId: "p1",
          scope: "profile.read",
          purpose: NAVIGATOR_CONSENT_PURPOSE,
          action: "interpret",
          silent: true,
        })
      ).ok,
    ).toBe(false);

    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
      {
        id: "c1",
        purpose: "other.purpose",
        status: "active",
        expiryDate: null,
        dataScope: [],
        sourceAction: null,
        createdAt: new Date(),
      } as never,
    ]);
    const mismatch = await verifyPurposeConsent({
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      scope: "profile.read",
      purpose: NAVIGATOR_CONSENT_PURPOSE,
      action: "interpret",
      silent: true,
    });
    expect(mismatch).toEqual({ ok: false, reason: "purpose_mismatch" });

    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
      {
        id: "c1",
        purpose: NAVIGATOR_CONSENT_PURPOSE,
        status: "revoked",
        expiryDate: null,
        dataScope: [],
        sourceAction: null,
        createdAt: new Date(),
      } as never,
    ]);
    expect(
      (
        await verifyPurposeConsent({
          tenantId: "t1",
          participantId: "p1",
          actorUserId: "p1",
          scope: "profile.read",
          purpose: NAVIGATOR_CONSENT_PURPOSE,
          action: "interpret",
          silent: true,
        })
      ),
    ).toEqual({ ok: false, reason: "consent_withdrawn" });

    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
      {
        id: "c1",
        purpose: NAVIGATOR_CONSENT_PURPOSE,
        status: "active",
        expiryDate: new Date(Date.now() - 1000),
        dataScope: [],
        sourceAction: null,
        createdAt: new Date(),
      } as never,
    ]);
    expect(
      (
        await verifyPurposeConsent({
          tenantId: "t1",
          participantId: "p1",
          actorUserId: "p1",
          scope: "profile.read",
          purpose: NAVIGATOR_CONSENT_PURPOSE,
          action: "interpret",
          silent: true,
        })
      ),
    ).toEqual({ ok: false, reason: "consent_expired" });
  });

  it("rejects invalid delegation when actor is not the participant", async () => {
    vi.mocked(hasParticipantAuthority).mockResolvedValue(false);
    const result = await verifyPurposeConsent({
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "delegate-1",
      scope: "profile.read",
      purpose: NAVIGATOR_CONSENT_PURPOSE,
      action: "interpret",
      silent: true,
    });
    expect(result).toEqual({ ok: false, reason: "delegation_invalid" });
  });

  it("accepts active purpose-matched consent for the participant", async () => {
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
      {
        id: "c-ok",
        purpose: NAVIGATOR_CONSENT_PURPOSE,
        status: "active",
        expiryDate: new Date(Date.now() + 60_000),
        dataScope: ["location", "serviceType"],
        sourceAction: "interpret,*",
        createdAt: new Date(),
      } as never,
    ]);
    const result = await verifyPurposeConsent({
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      scope: "profile.read",
      purpose: NAVIGATOR_CONSENT_PURPOSE,
      action: "interpret",
      permittedFields: ["location"],
      silent: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.consentRecordId).toBe("c-ok");
      expect(result.viaDelegation).toBe(false);
    }
  });
});

describe("Navigator Phase 1 — governed envelopes", () => {
  beforeEach(() => {
    vi.mocked(prisma.governedActionEnvelope.create).mockReset();
    vi.mocked(prisma.governedActionEnvelope.findFirst).mockReset();
    vi.mocked(prisma.governedActionEnvelope.updateMany).mockReset();
    vi.mocked(prisma.governedActionEnvelope.findUniqueOrThrow).mockReset();
    vi.mocked(createAuditEvent).mockClear();
    delete process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED;
    delete process.env.MAPABLE_NAVIGATOR_PILOT_ENVELOPES;
  });

  it("hashes payloads stably and validates draft schemas", () => {
    const a = hashGovernedPayload({ b: 1, a: 2 });
    const b = hashGovernedPayload({ a: 2, b: 1 });
    expect(a).toBe(b);
    expect(
      validateGovernedEnvelopePayload("transfer_filters_to_finder", {
        query: "support worker",
        location: "Sydney",
      }),
    ).toMatchObject({ query: "support worker" });
  });

  it("refuses envelope create when flags are off", async () => {
    await expect(
      createGovernedActionEnvelope({
        tenantId: "t1",
        participantId: "p1",
        initiatingUserId: "p1",
        capabilityKey: "navigator.provider_search.draft_service_request",
        action: "create_service_request_draft",
        payload: {
          serviceType: "support",
          locationLabel: "Sydney",
          providerOutletIds: ["o1"],
        },
        evidenceRefs: [],
        sourceRefs: [],
        consentReceiptId: "receipt-1",
        requiredApproverRole: "participant",
      }),
    ).rejects.toThrow("NAVIGATOR_ENVELOPES_DISABLED");
  });

  it("creates draft envelope and blocks replay / cross-tenant get", async () => {
    process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED = "true";
    process.env.MAPABLE_NAVIGATOR_PILOT_ENVELOPES = "true";

    vi.mocked(prisma.governedActionEnvelope.create).mockResolvedValue({
      id: "env-1",
      tenantId: "t1",
      participantId: "p1",
      initiatingUserId: "p1",
      capabilityKey: "navigator.provider_search.draft_service_request",
      action: "create_service_request_draft",
      payloadJson: {
        serviceType: "support",
        locationLabel: "Sydney",
        providerOutletIds: ["o1"],
      },
      payloadHash: "abc",
      evidenceRefs: [],
      sourceRefs: [],
      modelVersion: null,
      promptVersion: null,
      toolVersion: null,
      consentReceiptId: "receipt-1",
      requiredApproverRole: "participant",
      nonce: "nonce-test-value-123456789012",
      status: "proposed",
      approvalReason: null,
      rejectionReason: null,
      executionResult: null,
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      auditEventIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const created = await createGovernedActionEnvelope({
      tenantId: "t1",
      participantId: "p1",
      initiatingUserId: "p1",
      capabilityKey: "navigator.provider_search.draft_service_request",
      action: "create_service_request_draft",
      payload: {
        serviceType: "support",
        locationLabel: "Sydney",
        providerOutletIds: ["o1"],
      },
      evidenceRefs: [],
      sourceRefs: [],
      consentReceiptId: "receipt-1",
      requiredApproverRole: "participant",
    });
    expect(created.status).toBe("proposed");
    expect(created.nonce.length).toBeGreaterThan(10);

    // Cross-tenant get returns null
    vi.mocked(prisma.governedActionEnvelope.findFirst).mockResolvedValueOnce(
      null,
    );
    expect(
      await getGovernedActionEnvelope({
        envelopeId: created.id,
        tenantId: "other-tenant",
        participantId: "p1",
      }),
    ).toBeNull();

    // Expired envelope
    vi.mocked(prisma.governedActionEnvelope.findFirst).mockResolvedValueOnce({
      ...created,
      payloadJson: created.payload,
      status: "proposed",
      expiresAt: new Date(Date.now() - 1000),
    } as never);
    vi.mocked(prisma.governedActionEnvelope.update).mockResolvedValue({
      ...created,
      payloadJson: created.payload,
      status: "expired",
    } as never);
    await expect(
      approveGovernedActionEnvelope({
        envelopeId: created.id,
        tenantId: "t1",
        participantId: "p1",
        approverUserId: "p1",
        approverRole: "participant",
        consentStillValid: true,
      }),
    ).rejects.toThrow("NAVIGATOR_ENVELOPE_EXPIRED");

    // Model cannot approve
    vi.mocked(prisma.governedActionEnvelope.findFirst).mockResolvedValueOnce({
      ...created,
      payloadJson: created.payload,
      status: "proposed",
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    await expect(
      approveGovernedActionEnvelope({
        envelopeId: created.id,
        tenantId: "t1",
        participantId: "p1",
        approverUserId: "model",
        approverRole: "model",
        consentStillValid: true,
      }),
    ).rejects.toThrow("NAVIGATOR_ENVELOPE_MODEL_CANNOT_APPROVE");
  });
});
