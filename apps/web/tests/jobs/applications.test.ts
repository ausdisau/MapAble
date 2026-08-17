import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/jobs-participation", () => ({
  jobsParticipationConfig: {
    enabled: true,
    matchingExplanationsEnabled: true,
    employabilityScoringEnabled: false,
    automaticApplicantRejectionEnabled: false,
    disabilityInferenceEnabled: false,
    productivityRankingEnabled: false,
  },
  ensureJobsParticipationEnabled: vi.fn(),
  ensureMatchingExplanationsEnabled: vi.fn(),
}));
vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));
vi.mock("@/lib/jobs/job-service", () => ({
  createJobApplication: vi.fn(),
  submitJobApplication: vi.fn(),
  sanitizeApplicationForViewer: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    jobApplication: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    job: { findUnique: vi.fn() },
    interviewAdjustmentRequest: { upsert: vi.fn() },
  },
}));

import {
  submitParticipantApplication,
  withdrawParticipantApplication,
} from "@/lib/jobs/applications/participant-application-service";
import { prisma } from "@/lib/prisma";

describe("participant application service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires confirmed disclosure preview before submit", async () => {
    vi.mocked(prisma.jobApplication.findFirst).mockResolvedValue({
      id: "app-1",
      participantId: "p1",
      status: "draft",
      disclosurePreview: { status: "previewed" },
    } as never);

    await expect(
      submitParticipantApplication("app-1", "p1"),
    ).rejects.toThrow("DISCLOSURE_PREVIEW_NOT_CONFIRMED");
  });

  it("withdraws application for participant", async () => {
    vi.mocked(prisma.jobApplication.findFirst).mockResolvedValue({
      id: "app-1",
      participantId: "p1",
      status: "submitted",
    } as never);
    vi.mocked(prisma.jobApplication.update).mockResolvedValue({
      id: "app-1",
      status: "withdrawn",
    } as never);

    const app = await withdrawParticipantApplication("app-1", "p1");
    expect(app.status).toBe("withdrawn");
  });
});
