import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  assertNavigatorActionAllowed,
  isNavigatorPilotProhibited,
  NAVIGATOR_PILOT_PROHIBITED_ACTIONS,
} from "@/lib/ai/navigator/gates";
import { applyHardConstraints } from "@/lib/ai/navigator/matching/hard-constraints";
import {
  buildMatchResult,
  rankEligibleProviders,
} from "@/lib/ai/navigator/matching/rank";
import {
  DEFAULT_RANKING_WEIGHTS_RATIONALE,
  type ProviderCandidate,
} from "@/lib/ai/navigator/matching/types";
import { requireAiCapability } from "@/lib/ai/platform";
import { runEvalScenario } from "@/lib/ai/platform/evaluations/runner/run-scenario";
import { EVAL_SCENARIOS } from "@/lib/ai/platform/evaluations/scenarios/catalog";
import { navigatorPilotConfig } from "@/lib/config/navigator-pilot";

const FLAG_KEYS = [
  "MAPABLE_NAVIGATOR_PILOT_ENABLED",
  "MAPABLE_NAVIGATOR_PILOT_MODEL_ASSISTED",
  "MAPABLE_NAVIGATOR_PILOT_ENVELOPES",
  "MAPABLE_NAVIGATOR_PILOT_PASSPORT",
  "MAPABLE_NAVIGATOR_PILOT_MEMORY",
  "MAPABLE_NAVIGATOR_PILOT_MATCHING",
] as const;

describe("Navigator Phase 4 — assurance", () => {
  const previous: Partial<
    Record<(typeof FLAG_KEYS)[number], string | undefined>
  > = {};

  beforeEach(() => {
    for (const key of FLAG_KEYS) {
      previous[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of FLAG_KEYS) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("keeps all Navigator pilot flags default false", () => {
    expect(navigatorPilotConfig.enabled).toBe(false);
    expect(navigatorPilotConfig.modelAssistedEnabled).toBe(false);
    expect(navigatorPilotConfig.envelopesEnabled).toBe(false);
    expect(navigatorPilotConfig.passportEnabled).toBe(false);
    expect(navigatorPilotConfig.memoryEnabled).toBe(false);
    expect(navigatorPilotConfig.matchingEnabled).toBe(false);
  });

  it("registers Navigator capabilities as not_claimable / experimental", () => {
    for (const key of [
      "navigator.provider_search.interpret",
      "navigator.provider_search.match",
      "navigator.provider_search.draft_service_request",
      "navigator.provider_search.escalate",
    ]) {
      const cap = requireAiCapability(key);
      expect(cap.productionClaimStatus).toBe("not_claimable");
      expect(cap.maturity).toBe("experimental");
    }
  });

  it("blocks every permanent prohibited action", () => {
    for (const action of NAVIGATOR_PILOT_PROHIBITED_ACTIONS) {
      expect(isNavigatorPilotProhibited(action)).toBe(true);
      expect(() => assertNavigatorActionAllowed(action)).toThrow(
        /NAVIGATOR_PILOT_PROHIBITED/,
      );
    }
  });

  it("documents default ranking weight rationale", () => {
    expect(DEFAULT_RANKING_WEIGHTS_RATIONALE.length).toBeGreaterThan(20);
    expect(DEFAULT_RANKING_WEIGHTS_RATIONALE.toLowerCase()).toMatch(
      /participant|preference|eligibility/,
    );
  });

  it("never lets ranking invent eligibility after hard fail", () => {
    const candidates: ProviderCandidate[] = [
      {
        id: "p1",
        name: "Synthetic Support Co",
        suburb: "Sydney",
        state: "NSW",
        postcode: "2000",
        services: ["cleaning"],
        registrationGroups: [],
        updatedAt: new Date(),
        evidenceStatus: "unknown",
        conflictNotes: [],
      },
    ];
    const stage1 = applyHardConstraints(candidates, {
      serviceType: "occupational_therapy",
      state: "NSW",
      requiredServices: [],
      exclusions: [],
      communicationRequirements: [],
      accessibilityRequirements: [],
      credentialRequirements: [],
    });
    expect(stage1.eligible).toHaveLength(0);
    const ranked = rankEligibleProviders(stage1.eligible, {});
    expect(ranked.shortlist).toHaveLength(0);
    const result = buildMatchResult({
      eligible: stage1.eligible,
      eliminationSummary: stage1.eliminationSummary,
    });
    expect(result.status).toBe("NO_SAFE_MATCH");
  });

  it("passes synthetic Navigator eval scenarios", () => {
    const navigatorScenarios = EVAL_SCENARIOS.filter((s) =>
      s.tags.includes("navigator"),
    );
    expect(navigatorScenarios.length).toBeGreaterThanOrEqual(5);
    for (const scenario of navigatorScenarios) {
      const result = runEvalScenario(scenario);
      expect(result.passed, scenario.id).toBe(true);
      expect(result.tokenUsage).toBe(0);
      expect(result.estimatedCostUsd).toBe(0);
    }
  });
});
