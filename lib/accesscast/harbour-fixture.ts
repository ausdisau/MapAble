/**
 * Synthetic Harbour Civic AccessCast evidence fixtures.
 * Canonical refs compose Access Intelligence Next Harbour Living Access Graph IDs.
 * Not a public accessibility claim.
 */

import type { AccessEvidenceClass } from "@/lib/access-intelligence-next";
import { getHarbourGraph } from "@/lib/access-intelligence-next";

import type {
  AccessCastCondition,
  AccessCastConfirmationTask,
  AccessCastFallback,
  AccessCastRequirement,
  AccessCastSegment,
  AccessCastTimelineEntry,
} from "./types";

export const HARBOUR_PLACE_REF = "accessplace:synthetic:harbour_civic";
export const HARBOUR_ROOM_REF = "harbour_civic.room_3_12";
export const TAYLOR_REQUIREMENT_SET_REF = "fixture:taylor-harbour-v1";
export const STARTING_WORK_JOURNEY_REF = "journey:synthetic:starting-work-harbour-v1";

export const DEFAULT_INTENDED_JOURNEY_TIME = "2026-09-17T08:30:00+10:00";

/** Verify AI Next Harbour fixture IDs are available for composition. */
export function harbourCanonicalNodeIds(): string[] {
  return getHarbourGraph().nodes.map((n) => n.id);
}

export function taylorHardRequirements(overrides?: {
  liftStatus?: "unknown" | "outage" | "ok" | "stale" | "conflicting";
  corridorUnresolved?: boolean;
  doorwayOverlap?: boolean;
}): AccessCastRequirement[] {
  const lift = overrides?.liftStatus ?? "unknown";
  const corridorUnresolved = overrides?.corridorUnresolved ?? true;
  const doorwayOverlap = overrides?.doorwayOverlap ?? false;

  const reqs: AccessCastRequirement[] = [
    {
      ontologyConceptId: "physical.step_free",
      kind: "require",
      status: "matched",
      detail: "Step-free western entrance is verified in Harbour synthetic fixture",
      hard: true,
    },
    doorwayOverlap
      ? {
          ontologyConceptId: "physical.minimum_clear_width_mm",
          kind: "require",
          status: "unresolved",
          detail:
            "Doorway estimated at 830–880 mm overlaps the participant minimum of 850 mm — cannot confirm",
          hard: true,
        }
      : {
          ontologyConceptId: "physical.minimum_clear_width_mm",
          kind: "require",
          status: "matched",
          detail: "Western entrance measured at 910 mm (requires ≥ 850 mm)",
          hard: true,
        },
    {
      ontologyConceptId: "physical.accessible_toilet",
      kind: "require",
      status: "matched",
      detail: "Level 3 accessible toilet — venue declaration (synthetic)",
      hard: true,
    },
  ];

  if (lift === "outage") {
    reqs.push({
      ontologyConceptId: "physical.lift_operational",
      kind: "require",
      status: "failed",
      detail: "Lift A has an active verified outage — no step-free fallback to level 3",
      hard: true,
    });
  } else if (lift === "ok") {
    reqs.push({
      ontologyConceptId: "physical.lift_operational",
      kind: "require",
      status: "matched",
      detail: "Lift A confirmed operational for intended arrival window",
      hard: true,
    });
  } else if (lift === "stale") {
    reqs.push({
      ontologyConceptId: "physical.lift_operational",
      kind: "require",
      status: "unresolved",
      detail: "Lift A evidence is stale — last observation exceeded operational TTL",
      hard: true,
    });
  } else if (lift === "conflicting") {
    reqs.push({
      ontologyConceptId: "physical.lift_operational",
      kind: "require",
      status: "unresolved",
      detail: "Venue says lift restored; recent participant report says unavailable",
      hard: true,
    });
  } else {
    reqs.push({
      ontologyConceptId: "physical.lift_operational",
      kind: "require",
      status: "unresolved",
      detail: "Lift A operational status is not live in the synthetic fixture",
      hard: true,
    });
  }

  if (corridorUnresolved) {
    reqs.push({
      ontologyConceptId: "physical.minimum_clear_width_mm",
      kind: "require",
      status: "unresolved",
      detail: "Level 3 corridor clear width is unresolved",
      hard: true,
    });
  }

  return reqs;
}

export function harbourPlaceSegments(opts: {
  liftStatus: "unknown" | "outage" | "ok" | "stale" | "conflicting";
  includeVisionCandidate?: boolean;
}): AccessCastSegment[] {
  const liftState =
    opts.liftStatus === "outage"
      ? ("temporarily_unavailable" as const)
      : opts.liftStatus === "stale"
        ? ("stale" as const)
        : opts.liftStatus === "conflicting"
          ? ("conflicting" as const)
          : opts.liftStatus === "ok"
            ? ("likely_usable" as const)
            : ("cannot_confirm" as const);

  const liftFreshness =
    opts.liftStatus === "stale" ? ("stale" as const) : ("unknown" as const);

  const segments: AccessCastSegment[] = [
    {
      segmentId: "seg-external-path",
      kind: "external_path",
      label: "External approach path",
      currentState: "stable",
      futureState: null,
      evidenceSummary: "Step-free sealed path, 1800 mm clear width (synthetic)",
      freshness: "fresh",
      reliability: "insufficient_history",
      hardRequirementEffect: "supported",
      fallback: null,
      confirmationTask: null,
      responsibleOrganisation: "Harbour Civic Centre (synthetic)",
      canonicalRef: "harbour_civic.path_external",
      singlePointOfFailure: false,
    },
    {
      segmentId: "seg-entrance-west",
      kind: "entrance",
      label: "Western entrance",
      currentState: "stable",
      futureState: null,
      evidenceSummary: "Step-free, 910 mm clear width — independently verified (synthetic)",
      freshness: "fresh",
      reliability: "insufficient_history",
      hardRequirementEffect: "supported",
      fallback: null,
      confirmationTask: null,
      responsibleOrganisation: "Harbour Civic Centre (synthetic)",
      canonicalRef: "harbour_civic.entrance_west",
      singlePointOfFailure: false,
    },
    {
      segmentId: "seg-lift",
      kind: "internal_route",
      label: "Lift A to level 3",
      currentState: liftState,
      futureState: null,
      evidenceSummary:
        opts.liftStatus === "outage"
          ? "Active verified outage — no step-free fallback"
          : opts.liftStatus === "conflicting"
            ? "Venue declaration conflicts with recent participant report"
            : opts.liftStatus === "stale"
              ? "Lift operational evidence exceeded feature TTL"
              : "Lift operational status unknown",
      freshness: liftFreshness,
      reliability: "cannot_forecast",
      hardRequirementEffect:
        opts.liftStatus === "outage"
          ? "blocked"
          : opts.liftStatus === "ok"
            ? "supported"
            : "unresolved",
      fallback:
        opts.liftStatus === "outage"
          ? {
              fallbackId: "fb-no-step-free",
              label: "No verified step-free fallback",
              verified: false,
              summary: "No fully verified step-free alternative to level 3 is known",
              limitations: ["Synthetic fixture — not a production claim"],
            }
          : null,
      confirmationTask: {
        taskId: "task-confirm-lift",
        label: "Ask the venue whether Lift A is operating",
        responsibleOrganisation: "Harbour Civic Centre (synthetic)",
        dueAt: "2026-09-17T07:30:00+10:00",
        status: "suggested",
        segmentId: "seg-lift",
        doesNotGuaranteeJourney: true,
      },
      responsibleOrganisation: "Harbour Civic Centre (synthetic)",
      canonicalRef: "harbour_civic.lift_a",
      singlePointOfFailure: true,
    },
    {
      segmentId: "seg-room",
      kind: "exact_destination",
      label: "Room 3.12",
      currentState: "likely_usable",
      futureState: null,
      evidenceSummary: "Destination room present in Living Access Graph",
      freshness: "fresh",
      reliability: "insufficient_history",
      hardRequirementEffect: "supported",
      fallback: null,
      confirmationTask: null,
      responsibleOrganisation: "Harbour Civic Centre (synthetic)",
      canonicalRef: HARBOUR_ROOM_REF,
      singlePointOfFailure: false,
    },
  ];

  if (opts.includeVisionCandidate) {
    segments.push({
      segmentId: "seg-vision-candidate",
      kind: "external_path",
      label: "Possible temporary barrier (unverified Vision candidate)",
      currentState: "likely_usable",
      futureState: null,
      evidenceSummary:
        "Model candidate suggests a possible barrier — not verified; does not mark route unavailable",
      freshness: "aging",
      reliability: "cannot_forecast",
      hardRequirementEffect: "none",
      fallback: null,
      confirmationTask: {
        taskId: "task-review-vision",
        label: "Review unverified Vision candidate privately or request human confirmation",
        responsibleOrganisation: "Participant (private)",
        dueAt: null,
        status: "suggested",
        segmentId: "seg-vision-candidate",
        doesNotGuaranteeJourney: true,
      },
      responsibleOrganisation: "AccessCast synthetic Vision bridge",
      canonicalRef: null,
      singlePointOfFailure: false,
    });
  }

  return segments;
}

export function harbourConditions(opts: {
  liftStatus: "unknown" | "outage" | "ok" | "stale" | "conflicting";
  construction?: boolean;
  visionCandidate?: boolean;
}): AccessCastCondition[] {
  const conditions: AccessCastCondition[] = [];

  if (opts.liftStatus === "outage") {
    conditions.push({
      conditionId: "cond-lift-outage",
      label: "Lift A outage",
      kind: "incident",
      effectiveFrom: "2026-09-16T00:00:00+10:00",
      effectiveTo: null,
      affectsSegmentIds: ["seg-lift"],
      evidenceClass: "independently_verified_claim" satisfies AccessEvidenceClass,
      summary: "Verified operational outage on Lift A",
      independentlyBlocks: true,
    });
  }

  if (opts.liftStatus === "conflicting") {
    conditions.push({
      conditionId: "cond-lift-conflict",
      label: "Conflicting lift status",
      kind: "conflict",
      effectiveFrom: "2026-09-17T06:00:00+10:00",
      effectiveTo: null,
      affectsSegmentIds: ["seg-lift"],
      evidenceClass: "venue_declaration",
      summary: "Venue says restored; participant report says unavailable",
      independentlyBlocks: false,
    });
  }

  if (opts.construction) {
    conditions.push({
      conditionId: "cond-north-construction",
      label: "Northern entrance construction",
      kind: "construction",
      effectiveFrom: "2026-09-17T08:00:00+10:00",
      effectiveTo: "2026-09-17T18:00:00+10:00",
      affectsSegmentIds: ["seg-entrance-west"],
      evidenceClass: "authoritative_public_source",
      summary: "Construction scheduled near northern entrance from 8:00 am",
      independentlyBlocks: false,
    });
  }

  if (opts.visionCandidate) {
    conditions.push({
      conditionId: "cond-vision-candidate",
      label: "Possible barrier (model candidate)",
      kind: "model_candidate",
      effectiveFrom: null,
      effectiveTo: null,
      affectsSegmentIds: ["seg-vision-candidate"],
      evidenceClass: "model_candidate",
      summary: "Unverified Vision candidate — must not independently block the route",
      independentlyBlocks: false,
    });
  }

  return conditions;
}

export function harbourFallback(verified: boolean): AccessCastFallback {
  return {
    fallbackId: "fb-harbour-step-free",
    label: verified ? "Western entrance step-free route" : "No fully verified fallback route",
    verified,
    summary: verified
      ? "Western entrance step-free route saved in Visit Pack"
      : "No fully verified fallback route is currently known",
    limitations: ["Synthetic fixture — not a production claim"],
  };
}

export function harbourConfirmationTasks(includeVehicle: boolean): AccessCastConfirmationTask[] {
  const tasks: AccessCastConfirmationTask[] = [
    {
      taskId: "task-confirm-lift",
      label: "Ask the venue whether Lift A is operating",
      responsibleOrganisation: "Harbour Civic Centre (synthetic)",
      dueAt: "2026-09-17T07:30:00+10:00",
      status: "suggested",
      segmentId: "seg-lift",
      doesNotGuaranteeJourney: true,
    },
  ];
  if (includeVehicle) {
    tasks.unshift({
      taskId: "task-confirm-vehicle",
      label: "Confirm the accessible vehicle",
      responsibleOrganisation: "Transport operator (synthetic)",
      dueAt: "2026-09-17T07:30:00+10:00",
      status: "suggested",
      segmentId: "seg-transport",
      doesNotGuaranteeJourney: true,
    });
  }
  return tasks;
}

export function harbourPlaceTimeline(): AccessCastTimelineEntry[] {
  return [
    {
      at: "2026-09-17T07:30:00+10:00",
      label: "Lift confirmation recommended before departure",
      kind: "confirmation_due",
      segmentId: "seg-lift",
    },
    {
      at: "2026-09-17T08:00:00+10:00",
      label: "Construction scheduled near northern entrance",
      kind: "scheduled_change",
      segmentId: "seg-entrance-west",
    },
    {
      at: "2026-09-17T08:15:00+10:00",
      label: "Recommended departure buffer begins",
      kind: "departure_buffer",
      segmentId: null,
    },
    {
      at: "2026-09-17T08:30:00+10:00",
      label: "Journey start",
      kind: "journey_start",
      segmentId: null,
    },
    {
      at: "2026-09-17T09:10:00+10:00",
      label: "Expected arrival at Harbour Civic Centre",
      kind: "expected_arrival",
      segmentId: "seg-room",
    },
  ];
}
