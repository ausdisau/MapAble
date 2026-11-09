import { describe, expect, it } from "vitest";

import {
  getSignalEvidenceExample,
  projectSignalEvidenceForDay,
} from "@/lib/access/signal/day-evidence-projection";
import {
  isGaisStagingImportEnabled,
  toGaisAccessStagingDescriptor,
} from "@/lib/access/signal/gais-staging";
import {
  assertPrivateSignalChoice,
  isSignalDayPreviewEnabled,
  makeSignalParticipationChoice,
} from "@/lib/core/signal/participation";
import {
  addSignalPracticeToDay,
  SIGNAL_DAY_ACTIVITY_ID,
} from "@/lib/day/signal-participation-bridge";
import { assessDayPlan } from "@/lib/day/day-planner";
import { makeSyntheticDayPlan } from "@/lib/day/synthetic-fixtures";

const choiceInput = {
  challengeId: "journeys" as const,
  mode: "remote" as const,
  role: "researcher" as const,
  startTime: "15:15" as const,
  participantReviewed: true,
};

describe("Signal integrated with Core, Access and Day", () => {
  it("requires both flags and denies production-only legacy import", () => {
    expect(isSignalDayPreviewEnabled({})).toBe(false);
    expect(isSignalDayPreviewEnabled({
      MAPABLE_DAY_DEMO_ENABLED: "true",
      MAPABLE_DAY_SIGNAL_BRIDGE_DEMO_ENABLED: "true",
    })).toBe(true);
    expect(isGaisStagingImportEnabled({
      MAPABLE_GAIS_STAGING_DEMO_ENABLED: "true",
      NODE_ENV: "production",
    })).toBe(false);
  });

  it("rejects attempts to imply Core sharing or delegated authority", () => {
    expect(() => makeSignalParticipationChoice({
      ...choiceInput,
      participantReviewed: false,
    })).toThrow(/review/i);
    const choice = makeSignalParticipationChoice(choiceInput);
    expect(choice.sharingAuthorised).toBe(false);
    expect(choice.locationCaptureEnabled).toBe(false);
    expect(choice.submissionCreated).toBe(false);
    expect(choice.changesExternalRecords).toBe(false);
    expect(() => assertPrivateSignalChoice({ ...choice, sharingAuthorised: true } as typeof choice)).toThrow();
  });

  it("projects unknown, reported and disputed separately without public claims", () => {
    for (const id of ["unknown", "community_reported", "disputed", "feature_verified"] as const) {
      const projection = projectSignalEvidenceForDay(
        getSignalEvidenceExample(id),
        new Date("2026-11-10T00:00:00Z"),
      );
      expect(projection.publicRating).toBe("unknown");
      expect(projection.dayReadiness).toBe("review");
      expect(projection.publicPublicationAllowed).toBe(false);
      expect(projection.participantFitEstablished).toBe(false);
      expect(projection.independentWholeJourneyCheck).toBe(false);
      expect(projection.productionClaim).toBe("none");
    }
    const disputed = projectSignalEvidenceForDay(
      getSignalEvidenceExample("disputed"),
      new Date("2026-11-10T00:00:00Z"),
    );
    expect(disputed.featureEvidenceState).toBe("disputed");
  });

  it("treats stale evidence as outdated, never as ready", () => {
    const stale = {
      ...getSignalEvidenceExample("feature_verified"),
      reviewDue: "2026-11-09T20:00:00Z",
    };
    const result = projectSignalEvidenceForDay(stale, new Date("2026-11-10T00:00:00Z"));
    expect(result.featureEvidenceState).toBe("outdated");
    expect(result.publicRating).toBe("unknown");
  });

  it("adds a participant-chosen activity without changing the base plan", () => {
    const original = makeSyntheticDayPlan("baseline");
    const oldCount = original.activities.length;
    const choice = makeSignalParticipationChoice(choiceInput);
    const access = projectSignalEvidenceForDay(getSignalEvidenceExample("unknown"));
    const updated = addSignalPracticeToDay(original, choice, access);
    expect(original.activities).toHaveLength(oldCount);
    expect(updated.activities).toHaveLength(oldCount + 1);
    const activity = updated.activities.find((x) => x.id === SIGNAL_DAY_ACTIVITY_ID);
    expect(activity?.status).toBe("pending");
    expect(activity?.kind).toBe("participation");
    expect(activity?.workerEvidence).toBe("not_applicable");
    expect(activity?.vehicleEvidence).toBe("not_applicable");
    expect(assessDayPlan(updated).allConfirmedAndReady).toBe(false);
    expect(addSignalPracticeToDay(original, null, access)).toBe(original);
  });

  it("rejects duplicate activity insertion or a forged green access signal", () => {
    const plan = makeSyntheticDayPlan("baseline");
    const choice = makeSignalParticipationChoice(choiceInput);
    const access = projectSignalEvidenceForDay(getSignalEvidenceExample("feature_verified"));
    const updated = addSignalPracticeToDay(plan, choice, access);
    expect(() => addSignalPracticeToDay(updated, choice, access)).toThrow(/already/);
    expect(() => addSignalPracticeToDay(plan, choice, {
      ...access,
      publicPublicationAllowed: true,
    } as typeof access)).toThrow(/cannot authorise/);
  });

  it("preserves GAIS legacy provenance regardless of historical verification or pictogram", () => {
    const descriptor = toGaisAccessStagingDescriptor({
      source_record_id: "legacy:A-114",
      name: "Fictional historic point",
      original_verification_label: "Verified",
      original_marker_style: "wheelchair",
      source_layer: "Old accessible places",
      traffic_light_status: "unknown",
      mapable_verification_status: "unverified_legacy_import",
      latitude: -33.8,
      longitude: 151.2,
    });
    expect(descriptor.featureRating).toBe("unknown");
    expect(descriptor.verificationStatus).toBe("unknown");
    expect(descriptor.importedStatus).toBe("unverified_legacy_import");
    expect(descriptor.originalVerificationLabel).toBe("Verified");
    expect(descriptor.publicPublicationAllowed).toBe(false);
    expect(descriptor.readyForDayRouting).toBe(false);
    expect(descriptor.reinspectionRequired).toBe(true);
    expect(() => toGaisAccessStagingDescriptor({
      source_record_id: "legacy:1",
      traffic_light_status: "green",
      mapable_verification_status: "unverified_legacy_import",
    })).toThrow(/unknown/);
    expect(() => toGaisAccessStagingDescriptor({
      source_record_id: "legacy:1",
      traffic_light_status: "unknown",
      mapable_verification_status: "verified",
    })).toThrow(/unverified/);
  });

  it("rejects unplaced or invalid points with no fabricated coordinates", () => {
    expect(() => toGaisAccessStagingDescriptor({
      source_record_id: "legacy:1",
      traffic_light_status: "unknown",
      mapable_verification_status: "unverified_legacy_import",
      latitude: 95,
      longitude: 151.2,
    })).toThrow(/Invalid coordinates/);
  });
});
