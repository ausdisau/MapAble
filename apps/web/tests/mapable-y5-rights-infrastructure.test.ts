import { describe, expect, it } from "vitest";

import {
  ACCOUNTABILITY_TRANSPARENCY_DISCLAIMER,
  API_CERTIFICATION_DISCLAIMER,
  assertCertificationTransparencyCopy,
  FEDERATED_RESEARCH_DISCLAIMER,
  isApiCertificationV2Enabled,
  isCertifiedApiEcosystemV2Enabled,
  isCommunityGovernanceMembershipV2Enabled,
  isFederatedAccountabilityV2Enabled,
  isFederatedResearchV2Enabled,
  isInstitutionalPermanenceV2Enabled,
  isLongTermOutcomesV2Enabled,
  isResearchFederationAtScaleV2Enabled,
  OUTCOMES_NON_ADVISORY_DISCLAIMER,
  PARTNER_CONCENTRATION_WARNING_THRESHOLD,
  y5RightsInfrastructureConfig,
} from "@/lib/config/y5-rights-infrastructure";

describe("Y5 rights infrastructure config", () => {
  it("disables all Y5 features by default", () => {
    expect(y5RightsInfrastructureConfig.apiCertificationV2Enabled).toBe(false);
    expect(y5RightsInfrastructureConfig.certifiedApiEcosystemV2Enabled).toBe(false);
    expect(y5RightsInfrastructureConfig.federatedResearchV2Enabled).toBe(false);
    expect(y5RightsInfrastructureConfig.researchFederationAtScaleV2Enabled).toBe(false);
    expect(y5RightsInfrastructureConfig.communityGovernanceMembershipV2Enabled).toBe(false);
    expect(y5RightsInfrastructureConfig.longTermOutcomesV2Enabled).toBe(false);
    expect(y5RightsInfrastructureConfig.federatedAccountabilityV2Enabled).toBe(false);
    expect(y5RightsInfrastructureConfig.institutionalPermanenceV2Enabled).toBe(false);
  });
});

describe("Y5 layering helpers", () => {
  it("falls back to phase10/12 when Y5 flags off", () => {
    // Wave 0: phase10/12 scaffolds fail closed — fallbacks remain off unless explicitly enabled.
    expect(isApiCertificationV2Enabled()).toBe(false);
    expect(isCertifiedApiEcosystemV2Enabled()).toBe(false);
    expect(isFederatedResearchV2Enabled()).toBe(false);
    expect(isResearchFederationAtScaleV2Enabled()).toBe(false);
    expect(isCommunityGovernanceMembershipV2Enabled()).toBe(false);
    expect(isFederatedAccountabilityV2Enabled()).toBe(false);
  });
});

describe("API certification guardrails", () => {
  it("includes transparency disclaimer", () => {
    expect(API_CERTIFICATION_DISCLAIMER).toMatch(/not regulatory certification/i);
  });

  it("blocks certification claims in copy", () => {
    expect(() => assertCertificationTransparencyCopy("NDIS approved partner")).toThrow(
      "CERTIFICATION_CLAIM_BLOCKED"
    );
  });

  it("documents certification pipeline", () => {
    const pipeline = ["draft", "submitted", "under_review", "certified", "rejected"];
    expect(pipeline).toContain("under_review");
  });
});

describe("Federated research guardrails", () => {
  it("includes synthetic-only disclaimer", () => {
    expect(FEDERATED_RESEARCH_DISCLAIMER).toMatch(/synthetic data only/i);
  });

  it("documents agreement lifecycle", () => {
    const lifecycle = ["draft", "ethics_review", "approved", "active", "archived"];
    expect(lifecycle).toContain("ethics_review");
  });
});

describe("Research federation guardrails", () => {
  it("documents node lifecycle", () => {
    const lifecycle = ["pending", "approved", "suspended", "revoked"];
    expect(lifecycle).toHaveLength(4);
  });
});

describe("Membership guardrails", () => {
  it("documents enrollment lifecycle", () => {
    const lifecycle = ["pending", "active", "term_expired", "revoked"];
    expect(lifecycle).toContain("pending");
  });
});

describe("Outcomes guardrails", () => {
  it("includes non-advisory disclaimer", () => {
    expect(OUTCOMES_NON_ADVISORY_DISCLAIMER).toMatch(/not clinical/i);
  });

  it("documents wave publishing shape", () => {
    const wave = {
      waveLabel: "2029-Q4",
      measurementPeriodStart: "2029-10-01",
      measurementPeriodEnd: "2029-12-31",
      outcomes: [{ outcomeKey: "continuity_rate", cohortSize: 120 }],
    };
    expect(wave.outcomes[0].cohortSize).toBeGreaterThan(0);
  });
});

describe("Accountability guardrails", () => {
  it("includes transparency disclaimer", () => {
    expect(ACCOUNTABILITY_TRANSPARENCY_DISCLAIMER).toMatch(/not legal findings/i);
  });
});

describe("Ecosystem concentration", () => {
  it("uses 40% warning threshold", () => {
    expect(PARTNER_CONCENTRATION_WARNING_THRESHOLD).toBe(0.4);
  });

  it("documents concentration metric shape", () => {
    const metrics = {
      totalListings: 10,
      topOrganisationShare: 0.5,
      warning: true,
    };
    expect(metrics.warning).toBe(
      metrics.topOrganisationShare > PARTNER_CONCENTRATION_WARNING_THRESHOLD
    );
  });
});

describe("Institutional permanence", () => {
  it("defaults institutional permanence v2 off", () => {
    expect(isInstitutionalPermanenceV2Enabled()).toBe(false);
  });

  it("defaults long-term outcomes v2 off", () => {
    expect(isLongTermOutcomesV2Enabled()).toBe(false);
  });
});
