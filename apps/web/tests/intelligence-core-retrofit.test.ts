import { afterEach, describe, expect, it } from "vitest";

import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import {
  buildSessionConsent,
  hasSessionConsent,
  scopeForModule,
} from "@/intelligence/consent/session-consent";
import { platformBriefRequestSchema } from "@/intelligence/core-types";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("MapAble Core intelligence runtime", () => {
  it("keeps write actions disabled by default", () => {
    delete process.env.MAPABLE_AI_WRITE_ACTIONS;
    const config = getMapAbleIntelligenceConfig();
    expect(config.writeActionsEnabled).toBe(false);
  });

  it("disables all modules when the global kill switch is off", () => {
    process.env.MAPABLE_AI_ENABLED = "false";
    const config = getMapAbleIntelligenceConfig();
    expect(config.enabled).toBe(false);
    expect(Object.values(config.modules).every((enabled) => !enabled)).toBe(true);
  });

  it("keeps higher-risk modules off until explicitly enabled", () => {
    delete process.env.MAPABLE_AI_MOVES_ENABLED;
    delete process.env.MAPABLE_AI_FOODS_ENABLED;
    delete process.env.MAPABLE_AI_PAYMENTS_ENABLED;
    const config = getMapAbleIntelligenceConfig();
    expect(config.modules.moves).toBe(false);
    expect(config.modules.foods).toBe(false);
    expect(config.modules.payments).toBe(false);
  });
});

describe("request-scoped consent", () => {
  it("adds only selected module scopes and Core", () => {
    const consent = buildSessionConsent({
      modules: ["care", "transport"],
      includeAccessibilityProfile: false,
    });

    expect(consent.has("core.summary")).toBe(true);
    expect(consent.has("care.summary")).toBe(true);
    expect(consent.has("transport.summary")).toBe(true);
    expect(consent.has("jobs.summary")).toBe(false);
    expect(consent.has("profile.accessibility")).toBe(false);
  });

  it("requires a separate opt-in for the accessibility profile", () => {
    const withoutProfile = buildSessionConsent({
      modules: ["transport"],
      includeAccessibilityProfile: false,
    });
    const withProfile = buildSessionConsent({
      modules: ["transport"],
      includeAccessibilityProfile: true,
    });

    expect(hasSessionConsent(withoutProfile, ["profile.accessibility"])).toBe(false);
    expect(hasSessionConsent(withProfile, ["profile.accessibility"])).toBe(true);
  });

  it("maps every module to its own summary scope", () => {
    expect(scopeForModule("payments")).toBe("payments.summary");
    expect(scopeForModule("access")).toBe("access.summary");
  });
});

describe("platform brief contract", () => {
  it("rejects an empty module selection", () => {
    const parsed = platformBriefRequestSchema.safeParse({ modules: [] });
    expect(parsed.success).toBe(false);
  });

  it("accepts an explicit accessibility-profile opt-in", () => {
    const parsed = platformBriefRequestSchema.parse({
      modules: ["core", "transport"],
      includeAccessibilityProfile: true,
      consentScopes: [
        "core.summary",
        "transport.summary",
        "profile.accessibility",
      ],
    });
    expect(parsed.includeAccessibilityProfile).toBe(true);
  });
});
