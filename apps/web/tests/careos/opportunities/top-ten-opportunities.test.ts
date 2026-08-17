import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  platformPackCreate,
  platformPackFindUnique,
  platformPackUpdate,
  platformPackFindMany,
  checklistUpdate,
  missionFindFirst,
  missionUpdate,
  missionEventCreate,
  missionEventFindUnique,
  authorityGrantCreate,
  consentReceiptCreate,
  auditCreate,
  documentFindFirst,
  documentGrantCreate,
  thinMarketCreate,
  competencyEvidenceCreate,
  academyProposalCreate,
  academyProposalFindUnique,
  academyProposalUpdate,
  academyEnrollmentFindFirst,
  accessPlaceFindMany,
  careosEvidenceFindMany,
  lifespanCreate,
  tenantDenialCreate,
  workerEvidenceUpdate,
} = vi.hoisted(() => ({
  platformPackCreate: vi.fn(),
  platformPackFindUnique: vi.fn(),
  platformPackUpdate: vi.fn(),
  platformPackFindMany: vi.fn(),
  checklistUpdate: vi.fn(),
  missionFindFirst: vi.fn(),
  missionUpdate: vi.fn(),
  missionEventCreate: vi.fn(),
  missionEventFindUnique: vi.fn(),
  authorityGrantCreate: vi.fn(),
  consentReceiptCreate: vi.fn(),
  auditCreate: vi.fn(),
  documentFindFirst: vi.fn(),
  documentGrantCreate: vi.fn(),
  thinMarketCreate: vi.fn(),
  competencyEvidenceCreate: vi.fn(),
  academyProposalCreate: vi.fn(),
  academyProposalFindUnique: vi.fn(),
  academyProposalUpdate: vi.fn(),
  academyEnrollmentFindFirst: vi.fn(),
  accessPlaceFindMany: vi.fn(),
  careosEvidenceFindMany: vi.fn(),
  lifespanCreate: vi.fn(),
  tenantDenialCreate: vi.fn(),
  workerEvidenceUpdate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    platformRegistrationPack: {
      create: platformPackCreate,
      findUnique: platformPackFindUnique,
      update: platformPackUpdate,
      findMany: platformPackFindMany,
    },
    platformRegistrationChecklistItem: { update: checklistUpdate },
    careOSMission: { findFirst: missionFindFirst, update: missionUpdate },
    careOSMissionEvent: {
      create: missionEventCreate,
      findUnique: missionEventFindUnique,
    },
    participantAuthorityGrant: {
      create: authorityGrantCreate,
      findMany: vi.fn().mockResolvedValue([]),
    },
    consentReceipt: {
      create: consentReceiptCreate,
      findMany: vi.fn().mockResolvedValue([]),
    },
    auditEvent: { create: auditCreate },
    document: { findFirst: documentFindFirst },
    documentAccessGrant: {
      create: documentGrantCreate,
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    thinMarketContinuitySignal: {
      create: thinMarketCreate,
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
    },
    workerCompetencyEvidence: {
      create: competencyEvidenceCreate,
      update: workerEvidenceUpdate,
    },
    academyCompetencyProposal: {
      create: academyProposalCreate,
      findUnique: academyProposalFindUnique,
      update: academyProposalUpdate,
      findMany: vi.fn().mockResolvedValue([]),
    },
    providerAcademyEnrollment: { findFirst: academyEnrollmentFindFirst },
    accessPlace: { findMany: accessPlaceFindMany },
    careOSEvidenceReference: { findMany: careosEvidenceFindMany },
    lifespanLiaisonBrief: {
      create: lifespanCreate,
      findMany: vi.fn().mockResolvedValue([]),
    },
    tenantAccessDenial: { create: tenantDenialCreate, findMany: vi.fn() },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

import {
  createPlatformRegistrationPack,
  exportPlatformRegistrationPack,
} from "@/lib/careos/opportunities/platform-registration-pack";
import { issueWalletAuthorityCredential } from "@/lib/careos/opportunities/consent-wallet";
import {
  buildSchemeNavigationBrief,
  tagMissionSchemes,
} from "@/lib/careos/opportunities/scheme-coordination";
import {
  assertSafetyGatePassed,
  runCareOSSafetyGate,
} from "@/lib/careos/opportunities/safety-evaluation-gate";
import {
  explainThinMarketCapacity,
  recordThinMarketSignal,
} from "@/lib/careos/opportunities/thin-market-continuity";
import {
  proposeCompetencyFromAcademy,
  verifyCompetencyProposal,
} from "@/lib/careos/opportunities/workforce-passport-adapter";
import { queryAccessEvidenceGraph } from "@/lib/careos/opportunities/access-evidence-graph";
import { createLifespanLiaisonBrief } from "@/lib/careos/opportunities/lifespan-liaison";
import {
  assertMandatoryTenantContext,
  TenantIsolationError,
} from "@/lib/careos/opportunities/tenant-isolation";
import {
  UNIFIED_PROHIBITED_USES,
  isUnifiedProhibitedUse,
} from "@/lib/careos/policy/unified-prohibited-uses";
import { PROHIBITED_CAREOS_CAPABILITIES } from "@/lib/intelligence/careos/policy/prohibited-uses";
import { MAPABLE_PROHIBITED_AI_USES } from "@/intelligence/policies/prohibited-uses";

const OPPORTUNITY_ENV_FLAGS = [
  "MAPABLE_CAREOS_PLATFORM_REGISTRATION_ENABLED",
  "MAPABLE_CAREOS_CONSENT_WALLET_ENABLED",
  "MAPABLE_CAREOS_SAFETY_GATE_ENABLED",
  "MAPABLE_CAREOS_WORKFORCE_PASSPORT_ENABLED",
  "MAPABLE_CAREOS_SCHEME_COORDINATION_ENABLED",
  "MAPABLE_CAREOS_ACCESS_EVIDENCE_GRAPH_ENABLED",
  "MAPABLE_CAREOS_THIN_MARKET_CONTINUITY_ENABLED",
  "MAPABLE_CAREOS_LIFESPAN_LIAISON_ENABLED",
  "MAPABLE_CAREOS_TENANT_ISOLATION_ENABLED",
] as const;

describe("CareOS top-ten opportunity MVPs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of OPPORTUNITY_ENV_FLAGS) {
      process.env[key] = "true";
    }
  });

  it("O1 unifies prohibited-use registries", () => {
    expect(PROHIBITED_CAREOS_CAPABILITIES).toBe(UNIFIED_PROHIBITED_USES);
    expect(MAPABLE_PROHIBITED_AI_USES).toBe(UNIFIED_PROHIBITED_USES);
    expect(isUnifiedProhibitedUse("participant_risk_scoring")).toBe(true);
    expect(isUnifiedProhibitedUse("autonomous_claim_submission")).toBe(true);
  });

  it("O2 creates registration pack with claims hard-off and exports prepare-only payload", async () => {
    platformPackCreate.mockResolvedValue({
      id: "pack1",
      title: "MapAble platform pack",
      claimSubmissionEnabled: false,
      items: [{ id: "i1", standardKey: "no_automated_claims", status: "not_started" }],
    });
    platformPackFindUnique.mockResolvedValue({
      id: "pack1",
      title: "MapAble platform pack",
      organisationId: null,
      tenantId: null,
      status: "draft",
      notes: null,
      claimSubmissionEnabled: false,
      items: [
        {
          standardKey: "no_automated_claims",
          label: "Claims off",
          status: "human_confirmed",
          evidenceRefs: [],
          notes: null,
          completedAt: new Date(),
        },
      ],
    });
    platformPackUpdate.mockResolvedValue({});

    const pack = await createPlatformRegistrationPack({
      title: "MapAble platform pack",
      createdById: "admin1",
    });
    expect(pack.claimSubmissionEnabled).toBe(false);

    const exported = await exportPlatformRegistrationPack({
      packId: "pack1",
      actorUserId: "admin1",
    });
    expect(exported.claimSubmissionEnabled).toBe(false);
    expect(exported.automatedEligibility).toBe(false);
    expect(exported.kind).toBe("ndis_digital_platform_registration_pack");
  });

  it("O3 scheme briefs never automate eligibility and attach YPIRAC caution for aged care", () => {
    const brief = buildSchemeNavigationBrief({
      from: "ndis",
      to: "support_at_home",
    });
    expect(brief.eligibilityDecision).toBeNull();
    expect(brief.automated).toBe(false);
    expect(brief.ypiracCaution).toMatch(/YPIRAC/);
  });

  it("O3 tags missions without eligibility automation", async () => {
    missionFindFirst.mockResolvedValue({
      id: "m1",
      participantId: "p1",
      inputSummary: {},
    });
    missionUpdate.mockResolvedValue({});
    missionEventFindUnique.mockResolvedValue(null);
    missionEventCreate.mockResolvedValue({ id: "e1" });

    const result = await tagMissionSchemes({
      missionId: "m1",
      participantId: "p1",
      schemeKeys: ["foundational_supports"],
      actorUserId: "c1",
    });
    expect(result.eligibilityAutomated).toBe(false);
    expect(missionUpdate).toHaveBeenCalled();
  });

  it("O5 issues wallet authority with preferential receipt", async () => {
    authorityGrantCreate.mockResolvedValue({
      id: "g1",
      domain: "support_coordination",
    });
    consentReceiptCreate.mockResolvedValue({
      id: "r1",
      scope: "wallet:support_coordination",
      action: "granted",
    });

    const result = await issueWalletAuthorityCredential({
      participantId: "p1",
      delegateId: "d1",
      domain: "support_coordination",
      actions: ["view_caseload"],
      consentScopes: ["coordination"],
      expiresAt: new Date(Date.now() + 86_400_000),
      purpose: "temporary coordination access",
    });
    expect(result.preferentialReceipt.action).toBe("granted");
    expect(result.grant.id).toBe("g1");
  });

  it("O6 safety gate passes fail-closed fixture and signs report", () => {
    const report = runCareOSSafetyGate({ skipConfigCheck: true });
    assertSafetyGatePassed(report);
    expect(report.signature).toMatch(/^[a-f0-9]{64}$/);
    expect(report.prohibitedRegistrySize).toBeGreaterThan(10);
  });

  it("O7 records capacity statuses and rejects match scores", async () => {
    thinMarketCreate.mockResolvedValue({
      id: "s1",
      capacityStatus: "limited",
    });
    await recordThinMarketSignal({
      regionKey: "LGA-TEST",
      serviceCategory: "personal_care",
      capacityStatus: "limited",
      createdById: "admin1",
    });
    expect(
      explainThinMarketCapacity({ capacityStatus: "unknown" }).participantScore,
    ).toBeNull();
    expect(() =>
      explainThinMarketCapacity({
        capacityStatus: "available",
        matchScore: 0.9,
      }),
    ).toThrow(/MATCH_SCORES_FORBIDDEN/);
  });

  it("O8 proposes pending competency and requires human verify", async () => {
    academyEnrollmentFindFirst.mockResolvedValue({
      id: "en1",
      courseId: "c1",
      status: "completed",
      course: { code: "SAFEGUARDING-101" },
    });
    competencyEvidenceCreate.mockResolvedValue({
      id: "ev1",
      verificationStatus: "pending",
    });
    academyProposalCreate.mockResolvedValue({
      id: "pr1",
      status: "pending",
      evidenceId: "ev1",
    });
    academyProposalFindUnique.mockResolvedValue({
      id: "pr1",
      status: "pending",
      evidenceId: "ev1",
    });
    academyProposalUpdate.mockResolvedValue({ id: "pr1", status: "verified" });
    workerEvidenceUpdate.mockResolvedValue({});

    const proposed = await proposeCompetencyFromAcademy({
      workerProfileId: "wp1",
      courseId: "c1",
      competencyType: "safeguarding",
      proposedByUserId: "u1",
    });
    expect(proposed.autoVerified).toBe(false);
    expect(proposed.evidence.verificationStatus).toBe("pending");

    const verified = await verifyCompetencyProposal({
      proposalId: "pr1",
      verifiedByUserId: "admin1",
      approve: true,
    });
    expect(verified.status).toBe("verified");
  });

  it("O9 evidence graph keeps ratings unverified and unknown unknown", async () => {
    accessPlaceFindMany.mockResolvedValue([
      {
        id: "place1",
        name: "Library",
        confidence: "unknown",
        sourceType: "user_suggested",
      },
    ]);
    careosEvidenceFindMany.mockResolvedValue([]);

    const graph = await queryAccessEvidenceGraph({ placeId: "place1" });
    expect(graph.doctrine.ratingsAreNotVerified).toBe(true);
    expect(graph.nodes[0]?.ratingIsVerified).toBe(false);
    expect(graph.nodes[0]?.unknownRemainsUnknown).toBe(true);
  });

  it("O10 lifespan brief shows YPIRAC caution and never automates eligibility", async () => {
    lifespanCreate.mockResolvedValue({
      id: "b1",
      ypiracCautionShown: true,
    });
    const result = await createLifespanLiaisonBrief({
      participantId: "p1",
      schemeFrom: "ndis",
      schemeTo: "support_at_home",
      summary: "Discuss Support at Home options with human assessor",
      createdById: "coord1",
    });
    expect(result.eligibilityAutomated).toBe(false);
    expect(result.ypiracCaution).toMatch(/YPIRAC/);
    expect(result.humanAssessorRequired).toBe(true);
  });

  it("O12 denies missing tenant context and audits denial", async () => {
    tenantDenialCreate.mockResolvedValue({ id: "d1" });
    await expect(
      assertMandatoryTenantContext({
        actorUserId: "u1",
        tenantId: null,
        resourceType: "enterprise_workspace",
      }),
    ).rejects.toBeInstanceOf(TenantIsolationError);
    expect(tenantDenialCreate).toHaveBeenCalled();
  });
});
