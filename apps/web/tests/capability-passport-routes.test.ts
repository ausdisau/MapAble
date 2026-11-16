import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  workerFindFirst: vi.fn(),
  workerFindUnique: vi.fn(),
  memberFindFirst: vi.fn(),
  memberFindMany: vi.fn(),
  caseFindUnique: vi.fn(),
  caseFindMany: vi.fn(),
  caseCreate: vi.fn(),
  caseUpdate: vi.fn(),
  disputeCreate: vi.fn(),
  tx: vi.fn(),
  audit: vi.fn(),
  participantFindFirst: vi.fn(),
  rights: vi.fn(),
  enrollmentFindMany: vi.fn(),
  completionFindMany: vi.fn(),
  preferenceFindMany: vi.fn(),
}));

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: mocks.session,
}));
vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: mocks.audit,
}));
vi.mock("@/lib/intelligence/careos/context/participant-rights", () => ({
  buildParticipantRightsSnapshot: mocks.rights,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    workerProfile: {
      findFirst: mocks.workerFindFirst,
      findUnique: mocks.workerFindUnique,
    },
    organisationMember: {
      findFirst: mocks.memberFindFirst,
      findMany: mocks.memberFindMany,
    },
    capabilityReviewCase: {
      findUnique: mocks.caseFindUnique,
      findMany: mocks.caseFindMany,
      create: mocks.caseCreate,
      update: mocks.caseUpdate,
    },
    workerEvidenceDispute: { create: mocks.disputeCreate },
    participantProfile: { findFirst: mocks.participantFindFirst },
    providerAcademyEnrollment: { findMany: mocks.enrollmentFindMany },
    workerTrainingCompletion: { findMany: mocks.completionFindMany },
    careParticipantPreference: { findMany: mocks.preferenceFindMany },
    workerPassportSharePreference: { upsert: vi.fn() },
    workerScreeningRecord: { findMany: vi.fn().mockResolvedValue([]) },
    $transaction: mocks.tx,
  },
}));

import { POST as postReview } from "@/app/api/workforce/assessments/review/route";
import { GET as getLearning } from "@/app/api/workforce/learning/recommendations/route";
import { POST as postDispute } from "@/app/api/workforce/passport/disputes/route";
import { GET as getMe } from "@/app/api/workforce/passport/me/route";
import { GET as getParticipantSummary } from "@/app/api/workforce/passport/participant-summary/route";

const BASE = "http://localhost:3000";
const worker = {
  id: "worker-1",
  userId: "worker-user",
  organisationId: "org-1",
  displayName: "Worker One",
  active: true,
  credentialEvidence: [],
  competencyEvidence: [],
  screeningRecords: [],
  evidenceDisputes: [],
  passportSharePreference: null,
  organisation: { name: "Org One" },
};

describe("Capability Passport v1 routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.VERCEL_ENV = "preview";
    process.env.MAPABLE_CAPABILITY_PASSPORT_V1_ENABLED = "true";
    mocks.session.mockResolvedValue({
      id: "worker-user",
      primaryRole: "support_worker",
      roles: ["support_worker"],
    });
    mocks.workerFindFirst.mockResolvedValue(worker);
    mocks.workerFindUnique.mockResolvedValue(worker);
    mocks.enrollmentFindMany.mockResolvedValue([]);
    mocks.completionFindMany.mockResolvedValue([]);
    mocks.preferenceFindMany.mockResolvedValue([]);
    mocks.rights.mockResolvedValue({ blockedWorkerIds: [] });
    mocks.audit.mockResolvedValue(undefined);
    mocks.caseCreate.mockResolvedValue({ id: "case-1" });
    mocks.disputeCreate.mockResolvedValue({ id: "dispute-1" });
    mocks.tx.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        capabilityReviewCase: {
          findUnique: mocks.caseFindUnique,
          update: mocks.caseUpdate,
        },
        workerScreeningRecord: { findMany: vi.fn().mockResolvedValue([]) },
      }),
    );
  });

  afterEach(() => {
    delete process.env.VERCEL_ENV;
    delete process.env.MAPABLE_CAPABILITY_PASSPORT_V1_ENABLED;
  });

  it("404s in production even if the flag is on", async () => {
    process.env.VERCEL_ENV = "production";
    const response = await getMe();
    expect(response.status).toBe(404);
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it("7. blocks cross-worker passport reads", async () => {
    mocks.session.mockResolvedValue({
      id: "other-worker",
      primaryRole: "support_worker",
      roles: ["support_worker"],
    });
    mocks.workerFindFirst.mockResolvedValue(null);
    const response = await getMe();
    expect(response.status).toBe(404);
  });

  it("8. blocks cross-provider review", async () => {
    mocks.session.mockResolvedValue({
      id: "provider-b",
      primaryRole: "provider_admin",
      roles: ["provider_admin"],
    });
    mocks.memberFindFirst.mockResolvedValue(null);
    mocks.caseFindUnique.mockResolvedValue({
      id: "case-1",
      status: "open",
      workerProfile: { ...worker, userId: "worker-user" },
      workerProfileId: "worker-1",
      organisationId: "org-1",
      legalProhibition: false,
    });
    const response = await postReview(
      new Request(BASE + "/api/workforce/assessments/review", {
        method: "POST",
        headers: { "Content-Type": "application/json", origin: BASE },
        body: JSON.stringify({
          caseId: "case-1",
          decision: "hold",
          reason: "Need more evidence",
        }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("11. participant summary is scoped and limited", async () => {
    mocks.session.mockResolvedValue({
      id: "participant-1",
      primaryRole: "participant",
      roles: ["participant"],
    });
    mocks.participantFindFirst.mockImplementation(async (args: { where?: { id?: string; userId?: string } }) => {
      const id = args.where?.id;
      const userId = args.where?.userId;
      if (userId && userId !== "participant-1") return null;
      if (id && id !== "pp-1" && id !== "participant-1") return null;
      return { id: "pp-1", userId: "participant-1" };
    });
    const allowed = await getParticipantSummary(
      new Request(BASE + "/api/workforce/passport/participant-summary?workerProfileId=worker-1&participantId=participant-1"),
    );
    expect(allowed.status).toBe(200);
    const body = await allowed.json();
    expect(body.fullFile).toBe(false);
    expect(body.screeningNumbers).toBeNull();

    const denied = await getParticipantSummary(
      new Request(BASE + "/api/workforce/passport/participant-summary?workerProfileId=worker-1&participantId=someone-else"),
    );
    expect(denied.status).toBe(403);
  });

  it("12. AI cannot write screening or competency through review", async () => {
    mocks.session.mockResolvedValue({
      id: "assessor-1",
      primaryRole: "mapable_admin",
      roles: ["mapable_admin"],
    });
    const response = await postReview(
      new Request(BASE + "/api/workforce/assessments/review", {
        method: "POST",
        headers: { "Content-Type": "application/json", origin: BASE },
        body: JSON.stringify({
          caseId: "case-1",
          decision: "approve",
          reason: "model says yes",
          issuedByAi: true,
          screeningOutcome: "clearance",
        }),
      }),
    );
    expect(response.status).toBe(403);
    expect(mocks.caseUpdate).not.toHaveBeenCalled();
  });

  it("13. dispute path opens a human review case", async () => {
    const response = await postDispute(
      new Request(BASE + "/api/workforce/passport/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json", origin: BASE },
        body: JSON.stringify({
          workerProfileId: "worker-1",
          evidenceKind: "credential",
          evidenceId: "cred-1",
          reason: "This WWCC row is not mine.",
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(mocks.disputeCreate).toHaveBeenCalled();
    expect(mocks.caseCreate).toHaveBeenCalled();
  });

  it("14. learning recommendations work without AI", async () => {
    const response = await getLearning(new Request(BASE + "/api/workforce/learning/recommendations"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.aiRequired).toBe(false);
    expect(body.items.length).toBeGreaterThan(0);
  });

  it("does not add prisma migrate deploy to this vertical slice", () => {
    const files = [
      "lib/workforce/http.ts",
      "lib/config/capability-passport.ts",
      "lib/workforce/passport-service.ts",
      "app/api/workforce/passport/me/route.ts",
    ];
    for (const rel of files) {
      const source = readFileSync(path.join(process.cwd(), rel), "utf8");
      expect(source).not.toMatch(/prisma migrate deploy/);
    }
  });
});
