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
    job: { findUnique: vi.fn() },
    employmentProfile: { findUnique: vi.fn() },
    employerAccessibilityCommitment: { findUnique: vi.fn() },
    jobMatchExplanation: { upsert: vi.fn() },
  },
}));

import { generateMatchExplanation } from "@/lib/jobs/matching/match-explanation-service";
import { prisma } from "@/lib/prisma";

describe("match explanation service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates explanation without ranking language", async () => {
    vi.mocked(prisma.job.findUnique).mockResolvedValue({
      id: "job-1",
      status: "published",
      employmentType: "part_time",
      remoteAllowed: true,
      flexibleHours: true,
      location: "Sydney",
      accessibilityFeatures: { quietSpace: true },
      employerOrganisationId: "org-1",
      requirements: [
        {
          id: "req-1",
          label: "Customer service",
          category: "skill",
          isEssential: true,
        },
      ],
      workplaceLocation: null,
      employerOrganisation: { employerAccessibilityEvidence: [] },
    } as never);
    vi.mocked(prisma.employmentProfile.findUnique).mockResolvedValue({
      skills: ["Customer service"],
      interests: [],
      preferredWorkTypes: [],
      preferredHours: [],
      preferredLocations: [],
      remotePreference: "remote",
      transportDependency: false,
      supportDependency: false,
    } as never);
    vi.mocked(prisma.employerAccessibilityCommitment.findUnique).mockResolvedValue({
      statement: "We are inclusive",
    } as never);
    vi.mocked(prisma.jobMatchExplanation.upsert).mockImplementation(
      async ({ create }) => ({
        ...(create as object),
        id: "match-1",
        job: { title: "Retail assistant" },
      }),
    );

    const match = await generateMatchExplanation("job-1", "p1", "p1");

    expect(match.explanationSummary).toContain("No ranking");
    expect(match.requirementsMatched).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Customer service", status: "matched" }),
      ]),
    );
  });

  it("throws when job is not found", async () => {
    vi.mocked(prisma.job.findUnique).mockResolvedValue(null);

    await expect(
      generateMatchExplanation("missing", "p1", "p1"),
    ).rejects.toThrow("JOB_NOT_FOUND");
  });
});
