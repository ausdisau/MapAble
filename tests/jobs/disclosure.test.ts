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
vi.mock("@/lib/prisma", () => ({
  prisma: {
    jobApplication: { findFirst: vi.fn() },
    employmentProfile: { findUnique: vi.fn() },
    applicationDisclosurePreview: { upsert: vi.fn() },
  },
}));

import { buildDisclosurePreview } from "@/lib/jobs/disclosure/disclosure-preview-service";
import { prisma } from "@/lib/prisma";

describe("disclosure preview service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("withholds adjustment details when shareAdjustments is false", async () => {
    vi.mocked(prisma.jobApplication.findFirst).mockResolvedValue({
      id: "app-1",
      participantId: "p1",
      applicantSummary: "Summary",
      coverLetter: "Cover",
      reasonableAdjustmentRequest: "Quiet room",
      shareAdjustments: false,
      transportSupportNeeded: true,
      careSupportNeeded: false,
    } as never);
    vi.mocked(prisma.employmentProfile.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.applicationDisclosurePreview.upsert).mockImplementation(
      (async ({ create }: { create: unknown }) => create) as never,
    );

    const preview = await buildDisclosurePreview("app-1", "p1");

    expect(preview.fieldsToDisclose).toMatchObject({
      reasonableAdjustmentRequest: false,
    });
    expect(
      (preview.employerVisible as Record<string, unknown>)
        .reasonableAdjustmentRequest,
    ).toBe("[Adjustment request on file — not shared with employer]");
  });
});
