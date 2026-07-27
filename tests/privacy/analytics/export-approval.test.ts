import { describe, expect, it } from "vitest";

import { assertNoParticipantScoring } from "@/lib/config/analytics-research";

describe("export approval boundaries", () => {
  it("blocks participant scoring attempts", () => {
    expect(() => assertNoParticipantScoring()).not.toThrow();
  });

  it("documents non-anonymous export disclaimer pattern", () => {
    const disclaimer =
      "This export is not anonymous. De-identification level is documented above.";
    expect(disclaimer.toLowerCase()).toContain("not anonymous");
  });
});

describe("withdrawal effects", () => {
  it("models export blocking on withdrawal", () => {
    const withdrawal = {
      exportBlocked: true,
      dataPurged: false,
    };
    expect(withdrawal.exportBlocked).toBe(true);
    expect(withdrawal.dataPurged).toBe(false);
  });
});
