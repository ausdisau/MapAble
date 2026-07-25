import { describe, expect, it } from "vitest";

import { deferredModules, modules } from "@/app/lib/modules";
import {
  YEAR_ONE_DEFERRED_MODULE_PATHS,
  isYearOneDeferredPathEnabled,
  yearOneScopeConfig,
} from "@/lib/config/year-one-scope";
import { EMPLOYMENT_PROVIDER_PROGRAMMES } from "@/lib/employment-providers/des-iea";
import { POST_V1_GOVERNANCE_MESSAGE } from "@/lib/governance/post-v1-stub";
import {
  SUPPORTED_LOCALES,
  TOTAL_MOBILITY_SCHEME,
  resolveTransportSubsidyHint,
} from "@/lib/nz-schemes";
import { ALL_ROLES, isAmbassadorRole } from "@/lib/auth/roles";

describe("Year-One roadmap alignment", () => {
  it("exposes only Care, Transport, Jobs in the public module registry", () => {
    expect(modules.map((m) => m.key).sort()).toEqual(
      ["care", "jobs", "transport"].sort(),
    );
    expect(deferredModules.map((m) => m.key).sort()).toEqual(
      ["foods", "kids", "marketplace", "moves"].sort(),
    );
  });

  it("keeps deferred verticals off by default", () => {
    expect(yearOneScopeConfig.foodsEnabled).toBe(false);
    expect(yearOneScopeConfig.kidsEnabled).toBe(false);
    expect(yearOneScopeConfig.movesEnabled).toBe(false);
    expect(yearOneScopeConfig.marketplaceEnabled).toBe(false);
    for (const path of YEAR_ONE_DEFERRED_MODULE_PATHS) {
      expect(isYearOneDeferredPathEnabled(path)).toBe(false);
    }
  });

  it("foundations en-AU and en-NZ with Total Mobility subsidy hint", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en-AU", "en-NZ"]);
    expect(TOTAL_MOBILITY_SCHEME.defaultSubsidyFraction).toBe(0.75);
    expect(resolveTransportSubsidyHint("NZ")?.subsidyFraction).toBe(0.75);
    expect(resolveTransportSubsidyHint("AU")).toBeNull();
  });

  it("includes ambassador in RBAC roles", () => {
    expect(ALL_ROLES).toContain("ambassador");
    expect(isAmbassadorRole("ambassador")).toBe(true);
  });

  it("lists DES and IEA programme scaffolds", () => {
    expect(EMPLOYMENT_PROVIDER_PROGRAMMES.map((p) => p.id)).toEqual([
      "des",
      "iea",
    ]);
  });

  it("documents Post-V1 governance demotion message", () => {
    expect(POST_V1_GOVERNANCE_MESSAGE).toMatch(/Post-V1/i);
    expect(POST_V1_GOVERNANCE_MESSAGE).toMatch(/audit logs/i);
  });
});
