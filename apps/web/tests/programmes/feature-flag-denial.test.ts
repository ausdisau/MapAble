import { afterEach, describe, expect, it } from "vitest";

import {
  ProgrammeDisabledError,
  isProgrammeEnabled,
  programmeFlagsConfig,
  requireProgrammeEnabled,
} from "@/lib/programmes";
import { programmeFlagEnvVars } from "@/tests/fixtures/programme-foundation";

describe("programme feature flags", () => {
  const originalEnv: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const key of programmeFlagEnvVars) {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    }
  });

  it("defaults all programme flags to false", () => {
    for (const key of programmeFlagEnvVars) {
      originalEnv[key] = process.env[key];
      delete process.env[key];
    }

    expect(programmeFlagsConfig.pathwaysEnabled).toBe(false);
    expect(programmeFlagsConfig.integrationFoundryEnabled).toBe(false);
    expect(isProgrammeEnabled("pathways")).toBe(false);
  });

  it("throws ProgrammeDisabledError when programme is disabled", () => {
    expect(() => requireProgrammeEnabled("kids")).toThrow(
      ProgrammeDisabledError,
    );
  });

  it("does not expose flags via NEXT_PUBLIC prefix", () => {
    for (const key of programmeFlagEnvVars) {
      expect(key.startsWith("NEXT_PUBLIC_")).toBe(false);
    }
  });
});
