import { beforeEach, describe, expect, it, vi } from "vitest";

const requireApiSession = vi.fn();
const createAuditEvent = vi.fn();
const createSubmission = vi.fn();
const findFirstSubmission = vi.fn();
const refreshParticipantOnboarding = vi.fn();

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: (...args: unknown[]) => requireApiSession(...args),
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: (...args: unknown[]) => createAuditEvent(...args),
}));

vi.mock("@/lib/onboarding/onboarding-service", () => ({
  refreshParticipantOnboarding: (...args: unknown[]) =>
    refreshParticipantOnboarding(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    iCanV6IntakeSubmission: {
      create: (...args: unknown[]) => createSubmission(...args),
      findFirst: (...args: unknown[]) => findFirstSubmission(...args),
    },
  },
}));

import { GET, POST } from "@/app/api/participants/support-needs/route";

describe("POST /api/participants/support-needs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiSession.mockResolvedValue({
      id: "user-1",
      primaryRole: "participant",
      roles: ["participant"],
    });
    createSubmission.mockResolvedValue({ id: "sub-1" });
    refreshParticipantOnboarding.mockResolvedValue({});
  });

  it("rejects unauthenticated callers", async () => {
    requireApiSession.mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );
    const res = await POST(
      new Request("http://localhost/api/participants/support-needs", {
        method: "POST",
        body: JSON.stringify({ skipped: true }),
      }),
    );
    expect(res.status).toBe(401);
    expect(createSubmission).not.toHaveBeenCalled();
  });

  it("forbids non-participants", async () => {
    requireApiSession.mockResolvedValue({
      id: "worker-1",
      primaryRole: "support_worker",
      roles: ["support_worker"],
    });
    const res = await POST(
      new Request("http://localhost/api/participants/support-needs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skipped: true }),
      }),
    );
    expect(res.status).toBe(403);
    expect(createSubmission).not.toHaveBeenCalled();
  });

  it("records a skip without counting as a completed snapshot", async () => {
    const res = await POST(
      new Request("http://localhost/api/participants/support-needs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skipped: true }),
      }),
    );
    expect(res.status).toBe(202);
    const json = (await res.json()) as { skipped: boolean; status: string };
    expect(json.skipped).toBe(true);
    expect(json.status).toBe("registration_skipped");
    expect(createSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          participantId: "user-1",
          status: "registration_skipped",
        }),
      }),
    );
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "support_needs.assessor_skipped",
      }),
    );
    expect(refreshParticipantOnboarding).toHaveBeenCalledWith(
      "user-1",
      "user-1",
    );
  });

  it("stores a lite registration snapshot for participants", async () => {
    const res = await POST(
      new Request("http://localhost/api/participants/support-needs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedAreas: ["mobility"],
          answers: [{ domainId: "mobility", intensity: "some" }],
          consentDraftProcessing: true,
          consentNoClinicalPaste: true,
        }),
      }),
    );
    expect(res.status).toBe(202);
    const json = (await res.json()) as { skipped: boolean; status: string };
    expect(json.skipped).toBe(false);
    expect(json.status).toBe("registration_lite");
    expect(createSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "registration_lite",
          participantId: "user-1",
        }),
      }),
    );
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "support_needs.assessor_submitted",
      }),
    );
  });
});

describe("GET /api/participants/support-needs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiSession.mockResolvedValue({
      id: "user-1",
      primaryRole: "participant",
      roles: ["participant"],
    });
  });

  it("reports whether a submission exists", async () => {
    findFirstSubmission.mockResolvedValue({
      id: "sub-9",
      status: "registration_lite",
      createdAt: new Date("2026-07-26T00:00:00.000Z"),
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      hasSubmission: boolean;
      latest: { id: string } | null;
    };
    expect(json.hasSubmission).toBe(true);
    expect(json.latest?.id).toBe("sub-9");
  });
});
