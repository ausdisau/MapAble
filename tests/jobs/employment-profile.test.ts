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
    employmentProfile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { upsertEmploymentProfile } from "@/lib/jobs/participants/employment-profile-service";
import { prisma } from "@/lib/prisma";

describe("employment profile service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires participant authority", async () => {
    await expect(
      upsertEmploymentProfile({
        participantId: "p1",
        actorUserId: "other",
        skills: ["communication"],
      }),
    ).rejects.toThrow("PARTICIPANT_AUTHORITY_REQUIRED");
  });

  it("upserts profile for participant", async () => {
    vi.mocked(prisma.employmentProfile.upsert).mockResolvedValue({
      id: "prof-1",
      participantId: "p1",
      skills: ["communication"],
      interests: [],
      preferredWorkTypes: [],
      preferredHours: [],
      preferredLocations: [],
      remotePreference: null,
      communicationPrefs: {},
      adjustmentPrefs: {},
      disclosureChoices: {},
      transportDependency: false,
      supportDependency: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const profile = await upsertEmploymentProfile({
      participantId: "p1",
      actorUserId: "p1",
      skills: ["communication"],
    });

    expect(profile.id).toBe("prof-1");
    expect(prisma.employmentProfile.upsert).toHaveBeenCalled();
  });
});
