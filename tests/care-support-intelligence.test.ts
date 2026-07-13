import { describe, expect, it } from "vitest";

import {
  analyseSupportReadiness,
  careSupportIntelligenceRequestSchema,
} from "@/intelligence/care/support-intelligence-service";

const emptyRecords = {
  participantName: null,
  homeRegion: null,
  preferences: [],
  accessNeeds: [],
  safeguards: [],
  recentRequests: [],
  upcomingShifts: [],
};

const baseRequest = careSupportIntelligenceRequestSchema.parse({
  goal: "Attend my community appointment with reliable support.",
  supportContext: "community",
  desiredStartAt: "2026-07-20T00:00:00.000Z",
  durationMinutes: 120,
  supportTypes: ["Appointment support"],
  communicationPreferences: ["Ask me directly"],
  accessRequirements: ["Power wheelchair clearance"],
  region: "Sydney, NSW",
  linkedTransportRequired: false,
  highIntensitySupportRequested: false,
  backupPreference: "participant_selects_each_time",
  includeExistingRecords: false,
});

describe("Care and Support intelligence", () => {
  it("labels missing access information as unknown rather than no adjustment needed", () => {
    const request = { ...baseRequest, accessRequirements: [] };
    const result = analyseSupportReadiness({
      request,
      records: emptyRecords,
      capacity: { providers: [], workers: [] },
    });

    const access = result.checks.find((check) => check.id === "access");
    expect(access?.status).toBe("unknown");
    expect(access?.explanation).toContain("unknown");
    expect(result.readiness).toBe("needs_information");
  });

  it("keeps accessible transport as a separate participant-confirmed dependency", () => {
    const request = { ...baseRequest, linkedTransportRequired: true };
    const result = analyseSupportReadiness({
      request,
      records: emptyRecords,
      capacity: { providers: [], workers: [] },
    });

    const transport = result.checks.find(
      (check) => check.id === "transport_dependency",
    );
    expect(transport?.status).toBe("attention");
    expect(result.decisionsRequired).toContain(
      "Review and confirm a separate accessible transport arrangement.",
    );
  });

  it("requires human coordination when high-intensity competency evidence is absent", () => {
    const request = { ...baseRequest, highIntensitySupportRequested: true };
    const result = analyseSupportReadiness({
      request,
      records: emptyRecords,
      capacity: { providers: [], workers: [] },
    });

    const competency = result.checks.find((check) => check.id === "high_intensity");
    expect(competency?.status).toBe("attention");
    expect(result.readiness).toBe("human_coordination_recommended");
    expect(result.decisionsRequired).toContain(
      "Ask a qualified coordinator to verify competency and support-plan requirements.",
    );
  });

  it("does not turn worker evidence into a ranking or assignment", () => {
    const workers = [
      {
        workerProfileId: "worker-1",
        organisationId: "org-1",
        organisationName: "Provider One",
        displayName: "Worker One",
        declaredCapabilities: {
          serviceTypes: ["Appointment support"],
          serviceRegions: ["Sydney, NSW"],
          languages: ["English"],
          communicationCapabilities: ["AAC aware"],
          qualificationsSummary: "Certificate III",
        },
        recordedChecks: {
          workerProfileVerification: "verified",
          organisationVerification: "verified",
          workerScreening: "verified",
          workingWithChildren: "not_provided",
          firstAid: "verified",
          insurance: "verified",
          highIntensityCompetencyVerified: false,
        },
        verifiedTrustCredentials: [],
        availabilityWindows: [
          {
            dayOfWeek: "MONDAY",
            startTime: "09:00",
            endTime: "17:00",
            timezone: "Australia/Sydney",
            evidenceSource: "worker_availability_record",
          },
        ],
        notices: ["This record is not a recommendation, assignment or guarantee."],
      },
    ];

    const result = analyseSupportReadiness({
      request: baseRequest,
      records: emptyRecords,
      capacity: { providers: [], workers: workers as never[] },
    });

    const workerCheck = result.checks.find((check) => check.id === "worker_capability");
    expect(workerCheck?.status).toBe("confirmed");
    expect(workerCheck?.explanation).toContain("not an assignment or fit ranking");
  });
});
