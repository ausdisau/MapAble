import { describe, expect, it } from "vitest";

import { y1WedgeConfig } from "@/lib/config/y1-wedge";
import { isMicroConsentEnabled } from "@/lib/consent/micro-consent-service";
import {
  validateIncidentIntakePath,
  type IncidentIntakeWizardSteps,
} from "@/lib/incidents/incident-service";
import {
  participantSafeCandidateSummary,
} from "@/lib/matching/matching-service";
import {
  defaultSupportProfileSections,
  mergeSupportProfileSections,
  participantSafeSupportProfileSummary,
} from "@/lib/support/profile/types";

describe("Y1 wedge config", () => {
  it("disables all wedge features by default", () => {
    expect(y1WedgeConfig.supportProfileEnabled).toBe(false);
    expect(y1WedgeConfig.participantMatchReviewEnabled).toBe(false);
    expect(y1WedgeConfig.incidentIntakeV2Enabled).toBe(false);
    expect(y1WedgeConfig.microConsentEnabled).toBe(false);
    expect(y1WedgeConfig.backupShiftRecoveryEnabled).toBe(false);
  });
});

describe("Support profile sections", () => {
  it("merges draft updates without dropping unknown keys", () => {
    const base = defaultSupportProfileSections();
    const merged = mergeSupportProfileSections(base, {
      routinesJson: [{ label: "Morning routine", detail: "Breakfast at 8am" }],
    });
    expect(merged.routinesJson).toHaveLength(1);
    expect(merged.boundariesJson).toEqual([]);
  });

  it("summarises published sections for matching UI", () => {
    const summary = participantSafeSupportProfileSummary({
      ...defaultSupportProfileSections(),
      routinesJson: [{ label: "Morning", detail: "Tea first" }],
    });
    expect(summary.routineCount).toBe(1);
  });
});

describe("Explainable matching summaries", () => {
  it("returns participant-safe copy with top factors", () => {
    const summary = participantSafeCandidateSummary({
      score: 0.8,
      scoreExplanation: "Worker verification status is verified.",
      candidateType: "care_worker",
      status: "recommended",
      factors: [
        { factorType: "credential_status", explanation: "Worker is verified." },
      ],
    });
    expect(summary.matchQuality).toContain("Good fit");
    expect(summary.topFactors).toHaveLength(1);
  });
});

describe("Incident intake v2 validation", () => {
  const base: IncidentIntakeWizardSteps = {
    intakePath: "concern",
    category: "complaint",
    severity: "medium",
    title: "Test",
    description: "Details",
  };

  it("rejects safeguarding path without safeguarding flag", () => {
    expect(
      validateIncidentIntakePath({ ...base, intakePath: "safeguarding" })
    ).toContain("Safeguarding");
  });

  it("accepts valid concern path", () => {
    expect(validateIncidentIntakePath(base)).toBeNull();
  });
});

describe("Micro-consent", () => {
  it("is off unless both flags enabled", () => {
    expect(isMicroConsentEnabled()).toBe(false);
  });
});
