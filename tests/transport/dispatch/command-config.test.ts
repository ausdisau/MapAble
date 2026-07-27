import { describe, expect, it } from "vitest";

import { transportCommandConfig } from "@/lib/config/transport-command";

describe("transport command config", () => {
  it("hardcodes auto substitution to false", () => {
    expect(transportCommandConfig.autoSubstitutionEnabled).toBe(false);
  });
});
