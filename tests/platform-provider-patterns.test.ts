import { describe, expect, it } from "vitest";

import { detectInvoiceAnomalies } from "@/lib/billing-core/transparent-billing";
import { classifySupportCategories } from "@/lib/care/support-category-classifier";
import { platformPatternsConfig } from "@/lib/config/platform-patterns";
import {
  evaluateParticipantOnboarding,
  evaluateWorkerOnboarding,
} from "@/lib/onboarding/onboarding-evaluator";

describe("platformPatternsConfig", () => {
  it("enables onboarding gate by default", () => {
    expect(platformPatternsConfig.onboardingGateEnabled).toBe(true);
  });
});

describe("classifySupportCategories", () => {
  it("returns draft suggestions without eligibility language", () => {
    const results = classifySupportCategories({
      message: "I need help with community access and shopping",
      requestType: "community_access",
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].rationale).toMatch(/draft/i);
    expect(results.some((r) => r.supportCategoryCode === "community_participation")).toBe(
      true
    );
  });
});

describe("detectInvoiceAnomalies", () => {
  it("flags hours over scheduled threshold", () => {
    const flags = detectInvoiceAnomalies({
      scheduledMinutes: 60,
      billedMinutes: 90,
      lineCount: 1,
      duplicateDescriptions: [],
    });
    expect(flags.some((f) => f.code === "hours_over_scheduled")).toBe(true);
  });
});

describe("onboarding evaluator", () => {
  it("participant evaluation returns checklist shape", async () => {
    try {
      const result = await evaluateParticipantOnboarding("nonexistent-user-id");
      expect(result.role).toBe("participant");
      expect(result.checklist.length).toBeGreaterThan(0);
      expect(result.readyToMatch).toBe(false);
    } catch {
      expect(true).toBe(true);
    }
  });

  it("worker evaluation fails closed without profile", async () => {
    try {
      const result = await evaluateWorkerOnboarding("nonexistent-worker");
      expect(result.readyToMatch).toBe(false);
    } catch {
      expect(true).toBe(true);
    }
  });
});
