import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  SUPPORT_TYPE_OPTIONS,
  supportTypeLabel,
} from "@/components/care/SupportTypeChips";
import { transformCareSupport } from "@/server/agents/careSupportTransformer";

const carePlanDraftReviewSource = readFileSync(
  join(process.cwd(), "components/care/CarePlanDraftReview.tsx"),
  "utf8"
);
const careRequestWizardSource = readFileSync(
  join(process.cwd(), "components/care/CareRequestWizard.tsx"),
  "utf8"
);

describe("Care UI patterns — support type chips", () => {
  it("exposes human labels for all care request types (not raw enum strings)", () => {
    for (const option of SUPPORT_TYPE_OPTIONS) {
      expect(option.label).not.toMatch(/personal_care|domestic_assistance/);
      expect(supportTypeLabel(option.value)).toBe(option.label);
    }
    expect(supportTypeLabel("personal_care")).toBe("Personal care");
  });

  it("wizard uses SupportTypeChips instead of raw enum select", () => {
    expect(careRequestWizardSource).toContain("SupportTypeChips");
    expect(careRequestWizardSource).not.toMatch(
      /<select[^>]*name=["']requestType/i
    );
    expect(careRequestWizardSource).not.toMatch(/paste.*tasks.*json/i);
    expect(careRequestWizardSource).not.toContain("tasksJson");
  });
});

describe("Care UI patterns — draft review confirmation", () => {
  it("transformer blocks booking until participant confirmation", () => {
    const output = transformCareSupport({
      sessionId: "ui-test-session",
      message:
        "I need help with showering and dressing on Tuesday morning in Parramatta.",
      assessmentSignals: {},
      preferences: {},
    });
    expect(output.carePlanDraft.bookingStatus).toBe(
      "blocked_until_participant_confirmation"
    );
    expect(output.guardrailDecision.autoFinalizeBooking).toBe(false);
    expect(output.guardrailDecision.autoAssignWorkers).toBe(false);
  });

  it("draft review UI states nothing is booked until confirm", () => {
    expect(carePlanDraftReviewSource).toMatch(
      /nothing is booked and no worker is assigned until you confirm/i
    );
    expect(carePlanDraftReviewSource).toContain("Confirm and save request");
  });
});
