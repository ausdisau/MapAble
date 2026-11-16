import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  rate: vi.fn(() => true),
  rights: vi.fn(),
  workerFindMany: vi.fn(),
  workerFindFirst: vi.fn(),
  audit: vi.fn(),
  tx: vi.fn(),
  upsert: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: mocks.session,
}));
vi.mock("@/lib/api/ip-rate-limit", () => ({
  checkIpRateLimit: mocks.rate,
  getClientIp: () => "127.0.0.1",
}));
vi.mock("@/lib/intelligence/careos/context/participant-rights", () => ({
  buildParticipantRightsSnapshot: mocks.rights,
}));
vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: mocks.audit,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    workerProfile: {
      findMany: mocks.workerFindMany,
      findFirst: mocks.workerFindFirst,
    },
    $transaction: mocks.tx,
  },
}));

import { POST as shortlist } from "@/app/api/provider-finder/builder/relational-fit/matches/route";
import {
  DELETE as withdraw,
  PUT as save,
} from "@/app/api/provider-finder/builder/relational-fit/worker-profile/route";
import { DEFAULT_FIT_REQUEST } from "@/lib/support-builder/relational-fit";

const BASE = "http://localhost:3000";
const actor = {
  id: "participant-1",
  roles: ["participant"],
  primaryRole: "participant",
};
const rights = {
  blockedWorkerIds: [] as string[],
  blockedProviderIds: [] as string[],
  requiredWorkerCredentials: [] as string[],
  requiredCommunicationCapabilities: [] as string[],
  requiredVehicleFeatures: [],
  transferRequirements: [],
  securementRequirements: [],
  assistanceAnimalRequirements: [],
  sensoryRequirements: [],
  participantHardExclusions: [] as string[],
};

const optedIn = {
  id: "worker-1",
  displayName: "Opted-in worker",
  organisationId: "org-1",
  serviceTypes: ["personal assistance"],
  serviceRegions: ["Penrith"],
  languages: ["English"],
  communicationCapabilities: ["aac"],
  workerScreeningStatus: "verified",
  verificationStatus: "verified",
  organisation: { name: "Demo provider" },
  relationalFitProfile: {
    communicationModes: ["aac", "text"],
    routineStyle: "structured",
    interactionStyle: "quiet",
    initiativeStyle: "ask_first",
    continuityStyle: "regular",
    updatedAt: new Date("2026-11-01T10:00:00Z"),
  },
  credentialEvidence: [],
};

function callMatch(body: unknown = DEFAULT_FIT_REQUEST, origin = BASE) {
  return shortlist(new Request(BASE + "/api/provider-finder/builder/relational-fit/matches", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin },
    body: JSON.stringify(body),
  }));
}

const declaration = {
  workerProfileId: "worker-1",
  communicationModes: ["aac", "text"],
  routineStyle: "structured",
  interactionStyle: "quiet",
  initiativeStyle: "ask_first",
  continuityStyle: "regular",
  consentToMatching: true,
};
function callSave(body: unknown = declaration, origin = BASE) {
  return save(new Request(BASE + "/api/provider-finder/builder/relational-fit/worker-profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json", origin },
    body: JSON.stringify(body),
  }));
}

describe("Relational Fit v1 access and consent boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.VERCEL_ENV = "preview";
    process.env.MAPABLE_SUPPORT_BUILDER_ENABLED = "true";
    process.env.MAPABLE_RELATIONAL_FIT_ENABLED = "true";
    mocks.session.mockResolvedValue(actor);
    mocks.rate.mockReturnValue(true);
    mocks.rights.mockResolvedValue({ ...rights });
    mocks.workerFindMany.mockResolvedValue([optedIn]);
    mocks.workerFindFirst.mockResolvedValue({ id: "worker-1", organisationId: "org-1" });
    mocks.audit.mockResolvedValue(undefined);
    mocks.tx.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn({
      relationalFitWorkerProfile: {
        upsert: mocks.upsert,
        deleteMany: mocks.deleteMany,
      },
    }));
  });

  afterEach(() => {
    delete process.env.VERCEL_ENV;
    delete process.env.MAPABLE_SUPPORT_BUILDER_ENABLED;
    delete process.env.MAPABLE_RELATIONAL_FIT_ENABLED;
  });

  it("hard-disables production even if preview flags are on", async () => {
    process.env.VERCEL_ENV = "production";
    const response = await callMatch();
    expect(response.status).toBe(404);
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it("blocks cross-origin requests", async () => {
    const response = await callMatch(DEFAULT_FIT_REQUEST, "https://attacker.example");
    expect(response.status).toBe(403);
    expect(mocks.workerFindMany).not.toHaveBeenCalled();
  });

  it("requires an existing session for participant matching", async () => {
    mocks.session.mockResolvedValue(new Response("Sign in", { status: 401 }));
    const response = await callMatch();
    expect(response.status).toBe(401);
    expect(mocks.workerFindMany).not.toHaveBeenCalled();
  });

  it("does not let a worker-only account query another participant's shortlist", async () => {
    mocks.session.mockResolvedValue({ id: "worker-user", primaryRole: "support_worker", roles: ["support_worker"] });
    const response = await callMatch();
    expect(response.status).toBe(403);
  });

  it("excludes workers blocked in the participant's rights snapshot", async () => {
    mocks.rights.mockResolvedValue({ ...rights, blockedWorkerIds: ["worker-1"] });
    const response = await callMatch();
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.candidates).toEqual([]);
    expect(result.modelUsed).toBe(false);
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ resultCount: 0 }),
      }),
    );
  });

  it("does not return an opted-in worker without a required communication method", async () => {
    const response = await callMatch({ ...DEFAULT_FIT_REQUEST, communicationModes: ["auslan"] });
    const result = await response.json();
    expect(result.candidates).toEqual([]);
  });

  it("never returns unconsented workstyle records even if data layer is inconsistent", async () => {
    mocks.workerFindMany.mockResolvedValue([{ ...optedIn, relationalFitProfile: null }]);
    const response = await callMatch();
    const result = await response.json();
    expect(result.candidates).toEqual([]);
  });

  it("returns explanatory leads, not predictive scores or assignments", async () => {
    const response = await callMatch({
      ...DEFAULT_FIT_REQUEST,
      communicationModes: ["aac"],
      routine: { value: "structured", importance: "essential" },
    });
    const result = await response.json();
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].selectionStatus).toBe("review_required");
    expect(result.candidates[0].comparison).not.toHaveProperty("compatibilityPercent");
    expect(result.modelUsed).toBe(false);
    expect(result.storedParticipantPreferences).toBe(false);
    expect(mocks.audit).toHaveBeenCalledTimes(1);
  });

  it("requires explicit worker opt-in before saving", async () => {
    const response = await callSave({ ...declaration, consentToMatching: false });
    expect(response.status).toBe(400);
    expect(mocks.workerFindFirst).not.toHaveBeenCalled();
    expect(mocks.tx).not.toHaveBeenCalled();
  });

  it("rejects changes to a worker profile not owned by the current actor", async () => {
    mocks.workerFindFirst.mockResolvedValue(null);
    const response = await callSave();
    expect(response.status).toBe(403);
    expect(mocks.tx).not.toHaveBeenCalled();
  });

  it("uses an atomic transaction for owner-confirmed opt-in and audit", async () => {
    const response = await callSave();
    expect(response.status).toBe(200);
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { workerProfileId: "worker-1" } }),
    );
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "relational_fit.worker_opt_in" }),
    );
  });

  it("withdraws worker declarations only after verifying ownership", async () => {
    const response = await withdraw(new Request(
      BASE + "/api/provider-finder/builder/relational-fit/worker-profile?workerProfileId=worker-1",
      { method: "DELETE", headers: { origin: BASE } },
    ));
    expect(response.status).toBe(200);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { workerProfileId: "worker-1" },
    });
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "relational_fit.worker_opt_out" }),
    );
  });
});
