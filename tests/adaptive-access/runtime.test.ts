import { afterEach, describe, expect, it } from "vitest";

import {
  adaptParticipantDashboard,
  adaptServiceAgreementReview,
  adaptStartingWorkMission,
  adaptWhatChanged,
  adaptiveAccessConfig,
  assertRequiredTermsPreserved,
  correctAccessProfileField,
  createAccessProfileField,
  createAssistedOnboardingDefaults,
  createFamiliarInterfaceState,
  createParticipantAccessProfile,
  resolveLayoutVersion,
  resolvePresentationPolicy,
  revokeAccessProfileField,
} from "@/lib/access/adaptive";

describe("Adaptive Access Runtime", () => {
  afterEach(() => {
    delete process.env.MAPABLE_ADAPT_RUNTIME_ENABLED;
    delete process.env.MAPABLE_ACCESS_PROFILE_ENABLED;
    delete process.env.MAPABLE_FAMILIAR_INTERFACE_ENABLED;
    delete process.env.MAPABLE_EASY_READ_PRESENTATION_ENABLED;
  });

  it("keeps flags and claim state fail-closed by default", () => {
    expect(adaptiveAccessConfig.runtimeEnabled).toBe(false);
    expect(adaptiveAccessConfig.accessProfileEnabled).toBe(false);
    expect(adaptiveAccessConfig.authorityCeiling).toBe("PRESENTATION_ONLY");
    expect(adaptiveAccessConfig.productionClaimStatus).toBe("not_claimable");
  });

  it("refuses profile creation when access profile flag is off", () => {
    expect(() =>
      createParticipantAccessProfile({
        participantId: "p1",
        tenantId: "org1",
        fields: createAssistedOnboardingDefaults("2026-07-18T00:00:00.000Z"),
        nowIso: "2026-07-18T00:00:00.000Z",
      })
    ).toThrow(/MAPABLE_ACCESS_PROFILE_ENABLED/);
  });

  it("resolves presentation modes without selecting options or dropping terms", () => {
    process.env.MAPABLE_ADAPT_RUNTIME_ENABLED = "true";
    process.env.MAPABLE_ACCESS_PROFILE_ENABLED = "true";
    process.env.MAPABLE_EASY_READ_PRESENTATION_ENABLED = "true";

    const now = "2026-07-18T00:00:00.000Z";
    const profile = createParticipantAccessProfile({
      participantId: "p1",
      tenantId: "org1",
      fields: [
        ...createAssistedOnboardingDefaults(now),
        createAccessProfileField({
          key: "plainLanguagePreference",
          value: true,
          source: "participant",
          participantApproved: true,
          effectiveAtIso: now,
        }),
        createAccessProfileField({
          key: "oneQuestionAtATime",
          value: true,
          source: "participant",
          participantApproved: true,
          effectiveAtIso: now,
        }),
        createAccessProfileField({
          key: "informationDensity",
          value: "low",
          source: "participant",
          participantApproved: true,
          effectiveAtIso: now,
        }),
      ],
      nowIso: now,
    });

    const policy = resolvePresentationPolicy({
      route: "/agreements/review",
      component: "ServiceAgreementReview",
      profile,
      deviceCapability: {
        keyboard: true,
        screenReaderLikely: false,
        switchAccess: false,
        voiceControl: false,
        reducedMotionOs: false,
      },
      accessibilitySetting: { textZoomPercent: 100, highContrast: false },
      currentTask: "review_service_agreement",
      dataSensitivity: "restricted",
      familiarInterface: null,
    });

    expect(policy).not.toBeNull();
    expect(policy!.navigationMode).toBe("one_question");
    expect(policy!.contentRendition).toBe("plain_language");
    expect(policy!.informationDensity).toBe("low");
    expect(policy!.meaningPreservation.requiredTermsRetained).toBe(true);
    expect(policy!.meaningPreservation.optionsNotReorderedForPersuasion).toBe(
      true
    );
    expect(policy!.fallback).toBe("standard_non_ai_pathway");
  });

  it("applies security patches when familiar layout is frozen", () => {
    process.env.MAPABLE_FAMILIAR_INTERFACE_ENABLED = "true";
    const familiar = createFamiliarInterfaceState({
      choice: "retain_familiar_layout",
      frozenLayoutVersion: "dashboard.v1",
    });
    const resolved = resolveLayoutVersion({
      latestLayoutVersion: "dashboard.v2",
      familiar,
      securityPatchVersion: "security.2026-07",
    });
    expect(resolved.frozen).toBe(true);
    expect(resolved.layoutVersion).toBe("dashboard.v1");
    expect(resolved.securityPatchApplied).toBe("security.2026-07");
  });

  it("preserves required agreement terms and rejects meaning-altering drops", () => {
    const ok = assertRequiredTermsPreserved({
      originalText: "Fee schedule and cooling-off period apply.",
      renderedText: "Fee schedule and cooling-off period apply. (plain)",
      requiredTerms: ["Fee schedule", "cooling-off period"],
    });
    expect(ok).toEqual({ ok: true });

    const bad = assertRequiredTermsPreserved({
      originalText: "Fee schedule and cooling-off period apply.",
      renderedText: "You may pay later.",
      requiredTerms: ["Fee schedule", "cooling-off period"],
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.missing).toContain("Fee schedule");
    }
  });

  it("supports field correction and revocation with version bump", () => {
    process.env.MAPABLE_ACCESS_PROFILE_ENABLED = "true";
    const now = "2026-07-18T00:00:00.000Z";
    let profile = createParticipantAccessProfile({
      participantId: "p1",
      tenantId: "org1",
      fields: [
        createAccessProfileField({
          key: "preferredName",
          value: "Alex",
          source: "participant",
          participantApproved: true,
          effectiveAtIso: now,
        }),
      ],
      nowIso: now,
    });
    profile = correctAccessProfileField(
      profile,
      "preferredName",
      "Sam",
      "2026-07-18T01:00:00.000Z"
    );
    expect(profile.version).toBe(2);
    expect(profile.fields[0]?.value).toBe("Sam");
    profile = revokeAccessProfileField(
      profile,
      "preferredName",
      "2026-07-18T02:00:00.000Z"
    );
    expect(profile.fields[0]?.revokedAtIso).toBe("2026-07-18T02:00:00.000Z");
  });

  it("surface adapters no-op when runtime flag is off", () => {
    expect(adaptParticipantDashboard({ profile: null }).applied).toBe(false);
    expect(adaptStartingWorkMission({ profile: null }).applied).toBe(false);
    expect(adaptWhatChanged({ profile: null }).applied).toBe(false);
    const agreement = adaptServiceAgreementReview({
      profile: null,
      agreementText: "Term A",
      renderedText: "Term A",
      requiredTerms: ["Term A"],
    });
    expect(agreement.applied).toBe(false);
    expect(agreement.requiredTermsCheck).toEqual({ ok: true });
  });

  it("dashboard adapter applies density when runtime enabled", () => {
    process.env.MAPABLE_ADAPT_RUNTIME_ENABLED = "true";
    process.env.MAPABLE_ACCESS_PROFILE_ENABLED = "true";
    const now = "2026-07-18T00:00:00.000Z";
    const profile = createParticipantAccessProfile({
      participantId: "p1",
      tenantId: "org1",
      fields: [
        createAccessProfileField({
          key: "informationDensity",
          value: "low",
          source: "participant",
          participantApproved: true,
          effectiveAtIso: now,
        }),
      ],
      nowIso: now,
    });
    const result = adaptParticipantDashboard({ profile });
    expect(result.applied).toBe(true);
    expect(result.policy?.informationDensity).toBe("low");
  });
});
