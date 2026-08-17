import { describe, expect, it } from "vitest";

import {
  ALWAYS_SUPPRESSED_FIELDS,
  applySmallCellControls,
  describeDeidentificationLevel,
  isPseudonym,
  pseudonymiseParticipantId,
  shouldSuppressCohort,
  suppressSensitiveFields,
} from "@/lib/platform/privacy/deidentification";

describe("field suppression", () => {
  it("strips always-suppressed fields", () => {
    const { record, suppressedFields } = suppressSensitiveFields({
      name: "Alice",
      email: "alice@example.com",
      eventCount: 3,
    });
    expect(record.eventCount).toBe(3);
    expect(record.name).toBeUndefined();
    expect(suppressedFields).toContain("name");
    expect(suppressedFields).toContain("email");
  });

  it("lists all always-suppressed fields", () => {
    expect(ALWAYS_SUPPRESSED_FIELDS).toContain("clinicalNotes");
    expect(ALWAYS_SUPPRESSED_FIELDS).toContain("safeguardingNarrative");
  });
});

describe("pseudonymisation", () => {
  it("produces stable pseudonyms", () => {
    const a = pseudonymiseParticipantId("user-1", "salt");
    const b = pseudonymiseParticipantId("user-1", "salt");
    expect(a).toBe(b);
    expect(isPseudonym(a)).toBe(true);
  });

  it("never describes exports as anonymous", () => {
    expect(describeDeidentificationLevel("aggregated")).not.toContain(
      "anonymous",
    );
    expect(describeDeidentificationLevel("pseudonymised")).not.toContain(
      "anonymous",
    );
    expect(describeDeidentificationLevel("de-identified")).not.toContain(
      "anonymous",
    );
  });
});

describe("small-cell controls", () => {
  it("suppresses cohorts below threshold", () => {
    expect(applySmallCellControls(10, 3).suppressed).toBe(true);
    expect(applySmallCellControls(10, 10).suppressed).toBe(false);
  });

  it("flags cohorts for suppression", () => {
    expect(shouldSuppressCohort(4)).toBe(true);
    expect(shouldSuppressCohort(5)).toBe(false);
  });
});
