import {
  ACCESSCAST_STATE_LABELS,
  type AccessCastForecastState,
} from "./states";
import {
  assertStateConsistentWithHardFailures,
  assertUnknownHardNotStable,
  calculateForecastState,
  modelCandidateCannotIndependentlyBlock,
} from "./rules";
import {
  buildEvidenceItem,
  confidenceHorizonIso,
  forecastExpiryIso,
  resolveHorizon,
} from "./evidence";
import {
  DEFAULT_INTENDED_JOURNEY_TIME,
  HARBOUR_PLACE_REF,
  HARBOUR_ROOM_REF,
  STARTING_WORK_JOURNEY_REF,
  TAYLOR_REQUIREMENT_SET_REF,
  harbourCanonicalNodeIds,
  harbourConditions,
  harbourConfirmationTasks,
  harbourFallback,
  harbourPlaceSegments,
  harbourPlaceTimeline,
  taylorHardRequirements,
} from "./harbour-fixture";
import type {
  AccessCastEvidenceEnvelope,
  AccessCastOfflineEvaluation,
  AccessCastOfflinePack,
  AccessCastRequest,
  AccessCastResult,
  AccessCastSegment,
  AccessCastTimelineEntry,
} from "./types";

function whyFromState(
  state: AccessCastForecastState,
  segments: AccessCastSegment[],
  extras: string[],
): string[] {
  const why: string[] = [...extras];
  for (const s of segments) {
    if (s.currentState !== "stable" && s.currentState !== "likely_usable") {
      why.push(`${s.label}: ${s.evidenceSummary}`);
    } else if (s.hardRequirementEffect === "supported") {
      why.push(`${s.label} is supported by current synthetic evidence`);
    }
  }
  if (why.length === 0) {
    why.push(ACCESSCAST_STATE_LABELS[state]);
  }
  return why.slice(0, 8);
}

function buildEnvelope(input: {
  forecastId: string;
  journeyOrPlaceRef: string;
  requirementSetRef: string;
  generatedAt: string;
  intendedJourneyTime: string;
  horizon: AccessCastResult["horizon"];
  state: AccessCastForecastState;
  requirements: AccessCastResult["envelope"]["matchedRequirements"];
  conditions: AccessCastResult["envelope"]["conditions"];
  segments: AccessCastSegment[];
  fallback: AccessCastResult["envelope"]["fallback"];
  confirmationTasks: AccessCastResult["envelope"]["confirmationTasks"];
  confidenceHorizon: string;
  expiry: string;
  conflicts: AccessCastEvidenceEnvelope["conflicts"];
  assumptions: string[];
  limitations: string[];
  nowIso: string;
}): AccessCastEvidenceEnvelope {
  const matched = input.requirements.filter((r) => r.status === "matched");
  const failed = input.requirements.filter((r) => r.status === "failed");
  const unresolved = input.requirements.filter((r) => r.status === "unresolved");

  const sourceEvidence = input.segments.map((s) =>
    buildEvidenceItem({
      evidenceId: `ev:${s.segmentId}`,
      class: s.canonicalRef?.includes("entrance")
        ? "independently_verified_claim"
        : "synthetic_fixture",
      ontologyConceptId:
        s.hardRequirementEffect !== "none" ? "physical.lift_operational" : undefined,
      source: "harbour_synthetic_fixture",
      observedAt:
        s.freshness === "stale" ? "2026-06-01T00:00:00.000Z" : "2026-09-16T00:00:00.000Z",
      summary: s.evidenceSummary,
      limitations: ["Synthetic fixture — not a production claim"],
      nowIso: input.nowIso,
    }),
  );

  const staleConceptIds = sourceEvidence
    .filter((e) => e.stale && e.ontologyConceptId)
    .map((e) => e.ontologyConceptId!);

  return {
    forecastId: input.forecastId,
    journeyOrPlaceRef: input.journeyOrPlaceRef,
    requirementSetRef: input.requirementSetRef,
    forecastGeneratedAt: input.generatedAt,
    intendedJourneyTime: input.intendedJourneyTime,
    horizon: input.horizon,
    conclusionState: input.state,
    matchedRequirements: matched,
    failedRequirements: failed,
    unresolvedRequirements: unresolved,
    conditions: input.conditions,
    sourceEvidence,
    freshness: {
      oldestEvidenceAt: sourceEvidence.map((e) => e.observedAt).sort()[0] ?? null,
      newestEvidenceAt: sourceEvidence.map((e) => e.observedAt).sort().at(-1) ?? null,
      staleConceptIds,
    },
    reliability: "insufficient_history",
    conflicts: input.conflicts,
    assumptions: input.assumptions,
    fallback: input.fallback,
    confirmationTasks: input.confirmationTasks,
    confidenceHorizon: input.confidenceHorizon,
    expiry: input.expiry,
    auditCorrelationId: `audit:${input.forecastId}`,
    limitations: input.limitations,
  };
}

function listAlt(segments: AccessCastSegment[]): AccessCastResult["listAlternative"] {
  return segments.map((s) => ({
    id: s.segmentId,
    label: s.label,
    state: s.currentState,
    stateLabel: ACCESSCAST_STATE_LABELS[s.currentState],
    summary: s.evidenceSummary,
  }));
}

function finalise(result: AccessCastResult, requirements: AccessCastResult["envelope"]["matchedRequirements"] & AccessCastResult["envelope"]["failedRequirements"]): AccessCastResult {
  const allReqs = [
    ...result.envelope.matchedRequirements,
    ...result.envelope.failedRequirements,
    ...result.envelope.unresolvedRequirements,
  ];
  if (!assertStateConsistentWithHardFailures(result.state, allReqs)) {
    throw new Error("AccessCast invariant: failed hard requirement returned stable/likely_usable");
  }
  if (!assertUnknownHardNotStable(result.state, allReqs)) {
    throw new Error("AccessCast invariant: unresolved hard requirement returned stable");
  }
  if (!modelCandidateCannotIndependentlyBlock(result.envelope.conditions, result.state)) {
    throw new Error("AccessCast invariant: model candidate independently blocked route");
  }
  // Ensure Harbour fixture IDs are referenced
  const nodeIds = harbourCanonicalNodeIds();
  if (!nodeIds.includes("harbour_civic.lift_a")) {
    throw new Error("AccessCast composition failed: Harbour fixture missing lift node");
  }
  void requirements;
  return result;
}

/**
 * Synthetic Harbour place outlook (Wave 1 / PR 1).
 */
export function forecastHarbourPlaceOutlook(
  request: Partial<AccessCastRequest> = {},
): AccessCastResult {
  const scenario = request.scenarioId ?? "harbour_place_baseline";
  const nowIso = request.now ?? "2026-09-17T06:00:00+10:00";
  const intended = request.intendedJourneyTime ?? DEFAULT_INTENDED_JOURNEY_TIME;
  const requirementSetRef = request.requirementSetRef ?? TAYLOR_REQUIREMENT_SET_REF;
  const generatedAt = nowIso;
  const horizon = resolveHorizon(intended, nowIso);

  let liftStatus: "unknown" | "outage" | "ok" | "stale" | "conflicting" = "unknown";
  let vision = false;
  let construction = true;

  switch (scenario) {
    case "harbour_lift_outage":
      liftStatus = "outage";
      break;
    case "harbour_conflicting_lift":
      liftStatus = "conflicting";
      break;
    case "harbour_vision_candidate":
      liftStatus = "ok";
      vision = true;
      construction = false;
      break;
    case "harbour_place_baseline":
    case "starting_work_tomorrow":
    case "return_journey_fragile":
      liftStatus = "unknown";
      break;
    default: {
      const _exhaustive: never = scenario;
      void _exhaustive;
    }
  }

  const requirements = taylorHardRequirements({
    liftStatus,
    corridorUnresolved: liftStatus !== "outage",
  });
  const segments = harbourPlaceSegments({
    liftStatus,
    includeVisionCandidate: vision,
  });
  const conditions = harbourConditions({
    liftStatus,
    construction,
    visionCandidate: vision,
  });
  const fallback = harbourFallback(false);
  const confirmationTasks = harbourConfirmationTasks(false);
  const timeline = harbourPlaceTimeline();

  // Mark lift segment stale freshness for stale scenario
  if (liftStatus === "stale") {
    const lift = segments.find((s) => s.segmentId === "seg-lift");
    if (lift) lift.freshness = "stale";
  }

  const state = calculateForecastState({
    requirements,
    conditions,
    segments,
    fallback,
  });

  const confidenceHorizon = confidenceHorizonIso(intended, horizon);
  const expiry = forecastExpiryIso(generatedAt, horizon);
  const forecastId = `accesscast:harbour:${scenario}:${Date.parse(generatedAt)}`;

  const conflicts =
    liftStatus === "conflicting"
      ? [
          {
            conceptId: "physical.lift_operational",
            leftEvidenceId: "ev:venue-lift-restored",
            rightEvidenceId: "ev:participant-lift-down",
            note: "Venue declaration conflicts with recent participant report",
          },
        ]
      : [];

  const limitations = [
    "Synthetic AccessCast — not a production accessibility claim",
    "Not a safety guarantee or navigation authority",
    "Model confidence is not operational truth",
    "Unknown evidence is never converted into a positive forecast",
    "Map views are optional; the structured list is authoritative",
  ];

  const why = whyFromState(state, segments, [
    liftStatus === "outage"
      ? "Active verified lift outage blocks step-free access to level 3"
      : "Destination lift has no live status",
    construction ? "Northern entrance construction begins at 8:00 am" : "",
    vision ? "Unverified Vision candidate noted — does not mark route unavailable" : "",
  ].filter(Boolean));

  const envelope = buildEnvelope({
    forecastId,
    journeyOrPlaceRef: request.placeRef ?? HARBOUR_PLACE_REF,
    requirementSetRef,
    generatedAt,
    intendedJourneyTime: intended,
    horizon,
    state,
    requirements,
    conditions,
    segments,
    fallback,
    confirmationTasks,
    confidenceHorizon,
    expiry,
    conflicts,
    assumptions: [
      "Composes Access Intelligence Next Harbour Living Access Graph",
      "Canonical place ref: accessplace:synthetic:harbour_civic",
      "AccessPassport not on main — using fixture:taylor-harbour-v1",
    ],
    limitations,
    nowIso,
  });

  return finalise(
    {
      forecastId,
      synthetic: true,
      productionClaim: "none",
      tagline: "Know before you go.",
      journeyLabel: "Harbour Civic Centre — place outlook (Room 3.12 context)",
      intendedJourneyTime: intended,
      horizon,
      state,
      stateLabel: ACCESSCAST_STATE_LABELS[state],
      why,
      suggestedChecks: confirmationTasks.map((t) => t.label),
      fallbackSummary: fallback.summary,
      confidenceHorizon,
      segments,
      timeline,
      advisories: conditions.map((c) => ({
        advisoryId: `adv:${c.conditionId}`,
        title: c.label,
        body: c.summary,
        state,
        placeOrAssetRef: HARBOUR_PLACE_REF,
        evidenceSummary: c.summary,
        limitations: ["Synthetic advisory"],
      })),
      envelope,
      listAlternative: listAlt(segments),
      limitations,
    },
    requirements,
  );
}

/**
 * Starting Work journey outlook (PR 2) — Home → Harbour Room 3.12 with return.
 */
export function forecastStartingWorkJourney(
  request: Partial<AccessCastRequest> = {},
): AccessCastResult {
  const scenario = request.scenarioId ?? "starting_work_tomorrow";
  const nowIso = request.now ?? "2026-09-16T18:00:00+10:00";
  const intended = request.intendedJourneyTime ?? DEFAULT_INTENDED_JOURNEY_TIME;
  const requirementSetRef = request.requirementSetRef ?? TAYLOR_REQUIREMENT_SET_REF;
  const generatedAt = nowIso;
  const horizon = resolveHorizon(intended, nowIso);
  const returnFragile = scenario === "return_journey_fragile";

  const requirements = taylorHardRequirements({
    liftStatus: "stale",
    corridorUnresolved: true,
  });
  requirements.push({
    ontologyConceptId: "transport.accessible_vehicle",
    kind: "require",
    status: "unresolved",
    detail: "Accessible vehicle is requested but not confirmed by the operator",
    hard: true,
  });

  const placeSegments = harbourPlaceSegments({ liftStatus: "stale" });
  const lift = placeSegments.find((s) => s.segmentId === "seg-lift");
  if (lift) {
    lift.freshness = "stale";
    lift.currentState = "stale";
  }

  const journeySegments: AccessCastSegment[] = [
    {
      segmentId: "seg-origin",
      kind: "origin",
      label: "Home",
      currentState: "stable",
      futureState: null,
      evidenceSummary: "Participant origin (synthetic — location redacted)",
      freshness: "fresh",
      reliability: "insufficient_history",
      hardRequirementEffect: "none",
      fallback: null,
      confirmationTask: null,
      responsibleOrganisation: "Participant",
      canonicalRef: "participant.home",
      singlePointOfFailure: false,
    },
    {
      segmentId: "seg-pickup",
      kind: "pickup",
      label: "Pickup",
      currentState: "likely_usable",
      futureState: null,
      evidenceSummary: "Pickup window scheduled; curb access assumed from fixture",
      freshness: "fresh",
      reliability: "insufficient_history",
      hardRequirementEffect: "supported",
      fallback: null,
      confirmationTask: null,
      responsibleOrganisation: "Transport operator (synthetic)",
      canonicalRef: null,
      singlePointOfFailure: false,
    },
    {
      segmentId: "seg-transport",
      kind: "transport",
      label: "Accessible vehicle",
      currentState: "fragile",
      futureState: null,
      evidenceSummary: "Accessible vehicle requested but not confirmed — single point of failure",
      freshness: "aging",
      reliability: "cannot_forecast",
      hardRequirementEffect: "unresolved",
      fallback: {
        fallbackId: "fb-no-vehicle-alt",
        label: "No verified alternative accessible vehicle",
        verified: false,
        summary: "No verified fallback vehicle booking exists",
        limitations: ["Synthetic"],
      },
      confirmationTask: {
        taskId: "task-confirm-vehicle",
        label: "Confirm the accessible vehicle",
        responsibleOrganisation: "Transport operator (synthetic)",
        dueAt: "2026-09-17T07:30:00+10:00",
        status: "suggested",
        segmentId: "seg-transport",
        doesNotGuaranteeJourney: true,
      },
      responsibleOrganisation: "Transport operator (synthetic)",
      canonicalRef: "transport:synthetic:starting-work-outward",
      singlePointOfFailure: true,
    },
    {
      segmentId: "seg-stop",
      kind: "destination_stop",
      label: "Harbour ferry stop / drop-off",
      currentState: "stable",
      futureState: null,
      evidenceSummary: "Step-free berth in Harbour fixture",
      freshness: "fresh",
      reliability: "insufficient_history",
      hardRequirementEffect: "supported",
      fallback: null,
      confirmationTask: null,
      responsibleOrganisation: "Harbour Civic Precinct (synthetic)",
      canonicalRef: "harbour_civic.stop_ferry",
      singlePointOfFailure: false,
    },
    ...placeSegments,
    {
      segmentId: "seg-return",
      kind: "return_journey",
      label: "Return accessible transport",
      currentState: "fragile",
      futureState: null,
      evidenceSummary: returnFragile
        ? "Return trip requested but not accepted — whole journey remains fragile"
        : "Return transport requested but not confirmed — whole journey remains fragile",
      freshness: "aging",
      reliability: "cannot_forecast",
      hardRequirementEffect: "unresolved",
      fallback: {
        fallbackId: "fb-return-unverified",
        label: "Unverified return fallback",
        verified: false,
        summary: "No verified return accessible trip",
        limitations: ["Synthetic"],
      },
      confirmationTask: {
        taskId: "task-confirm-return",
        label: "Confirm return accessible transport",
        responsibleOrganisation: "Transport operator (synthetic)",
        dueAt: "2026-09-17T12:00:00+10:00",
        status: "suggested",
        segmentId: "seg-return",
        doesNotGuaranteeJourney: true,
      },
      responsibleOrganisation: "Transport operator (synthetic)",
      canonicalRef: "transport:synthetic:starting-work-return",
      singlePointOfFailure: true,
    },
  ];

  // Worker confirmed — soft service dependency (not hard for place access, but noted)
  const conditions = harbourConditions({
    liftStatus: "stale",
    construction: true,
  });
  conditions.push({
    conditionId: "cond-vehicle-unconfirmed",
    label: "Accessible vehicle unconfirmed",
    kind: "service_unconfirmed",
    effectiveFrom: null,
    effectiveTo: null,
    affectsSegmentIds: ["seg-transport", "seg-return"],
    evidenceClass: "synthetic_fixture",
    summary: "Vehicle requested; operator acceptance not received",
    independentlyBlocks: false,
  });
  conditions.push({
    conditionId: "cond-worker-confirmed",
    label: "Support worker confirmed",
    kind: "service_unconfirmed",
    effectiveFrom: "2026-09-16T12:00:00+10:00",
    effectiveTo: null,
    affectsSegmentIds: ["seg-origin"],
    evidenceClass: "synthetic_fixture",
    summary: "Workplace support worker confirmation received (synthetic)",
    independentlyBlocks: false,
  });

  const fallback = harbourFallback(false);
  const confirmationTasks = [
    ...harbourConfirmationTasks(true),
    {
      taskId: "task-save-western",
      label: "Save the western entrance route in the Visit Pack",
      responsibleOrganisation: "Participant",
      dueAt: null,
      status: "suggested" as const,
      segmentId: "seg-entrance-west",
      doesNotGuaranteeJourney: true as const,
    },
    {
      taskId: "task-confirm-return",
      label: "Confirm return accessible transport",
      responsibleOrganisation: "Transport operator (synthetic)",
      dueAt: "2026-09-17T12:00:00+10:00",
      status: "suggested" as const,
      segmentId: "seg-return",
      doesNotGuaranteeJourney: true as const,
    },
  ];

  const timeline: AccessCastTimelineEntry[] = [
    {
      at: "2026-09-17T07:30:00+10:00",
      label: "Accessible vehicle confirmation due",
      kind: "confirmation_due",
      segmentId: "seg-transport",
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
      label: "Expected arrival",
      kind: "expected_arrival",
      segmentId: "seg-room",
    },
    {
      at: "2026-09-17T09:30:00+10:00",
      label: "Workplace induction",
      kind: "appointment",
      segmentId: "seg-room",
    },
    {
      at: "2026-09-17T12:00:00+10:00",
      label: "Return-transport confirmation due",
      kind: "return_confirmation",
      segmentId: "seg-return",
    },
  ];

  const state = calculateForecastState({
    requirements,
    conditions,
    segments: journeySegments,
    fallback,
  });

  const confidenceHorizon = confidenceHorizonIso(intended, horizon);
  const expiry = forecastExpiryIso(generatedAt, horizon);
  const forecastId = `accesscast:starting-work:${scenario}:${Date.parse(generatedAt)}`;

  const limitations = [
    "Synthetic Starting Work AccessCast — not a production claim",
    "Not a safety guarantee; confirmation_requested ≠ journey_guaranteed",
    "Return journey fragility is never hidden by outward success",
    "Worker confirmation does not confirm vehicle or lift",
    "Composes Harbour fixture IDs from Access Intelligence Next",
  ];

  const why = [
    "Step-free western entrance is verified",
    "Accessible vehicle is requested but not confirmed",
    "Destination lift evidence is stale",
    "Northern entrance construction begins at 8:00 am",
    "Return accessible transport is unconfirmed",
  ];

  const envelope = buildEnvelope({
    forecastId,
    journeyOrPlaceRef: request.journeyRef ?? STARTING_WORK_JOURNEY_REF,
    requirementSetRef,
    generatedAt,
    intendedJourneyTime: intended,
    horizon,
    state,
    requirements,
    conditions,
    segments: journeySegments,
    fallback,
    confirmationTasks,
    confidenceHorizon,
    expiry,
    conflicts: [],
    assumptions: [
      "Starting Work golden journey synthetic scenario",
      `Destination: ${HARBOUR_ROOM_REF}`,
      "Support worker confirmed; vehicle and return not accepted",
    ],
    limitations,
    nowIso,
  });

  return finalise(
    {
      forecastId,
      synthetic: true,
      productionClaim: "none",
      tagline: "Know before you go.",
      journeyLabel: "Home to Harbour Civic Centre, Room 3.12",
      intendedJourneyTime: intended,
      horizon,
      state,
      stateLabel: ACCESSCAST_STATE_LABELS[state],
      why,
      suggestedChecks: confirmationTasks.map((t) => t.label),
      fallbackSummary: fallback.summary,
      confidenceHorizon,
      segments: journeySegments,
      timeline,
      advisories: conditions.map((c) => ({
        advisoryId: `adv:${c.conditionId}`,
        title: c.label,
        body: c.summary,
        state,
        placeOrAssetRef: HARBOUR_PLACE_REF,
        evidenceSummary: c.summary,
        limitations: ["Synthetic advisory"],
      })),
      envelope,
      listAlternative: listAlt(journeySegments),
      limitations,
    },
    requirements,
  );
}

/**
 * Primary forecast entry — routes by request shape / scenario.
 */
export function generateAccessCast(request: AccessCastRequest): AccessCastResult {
  const scenario = request.scenarioId ?? "harbour_place_baseline";
  if (
    scenario === "starting_work_tomorrow" ||
    scenario === "return_journey_fragile" ||
    request.journeyRef
  ) {
    return forecastStartingWorkJourney(request);
  }
  return forecastHarbourPlaceOutlook(request);
}

/**
 * Compile an offline Visit Pack projection (PR 3).
 */
export function compileAccessCastOfflinePack(
  result: AccessCastResult,
  savedAt?: string,
): AccessCastOfflinePack {
  return {
    packId: `pack:${result.forecastId}`,
    forecastId: result.forecastId,
    generatedAt: result.envelope.forecastGeneratedAt,
    expiresAt: result.envelope.expiry,
    savedAt: savedAt ?? result.envelope.forecastGeneratedAt,
    journeyLabel: result.journeyLabel,
    stateAtSave: result.state,
    result,
    sourcesNotRefreshed: [
      "AccessOps live status",
      "TransportTrip confirmation",
      "Venue lift feed",
    ],
    limitations: [
      ...result.limitations,
      "Offline snapshot only — not silently current",
      `Generated at ${result.envelope.forecastGeneratedAt}`,
      `Expires at ${result.envelope.expiry}`,
    ],
    offlineClaim: "saved_snapshot_only",
  };
}

/**
 * Evaluate a saved offline pack at a later time.
 * Expired packs become stale and never claim current operational truth.
 */
export function evaluateOfflineAccessCast(
  pack: AccessCastOfflinePack,
  evaluatedAt: string,
): AccessCastOfflineEvaluation {
  const expired = new Date(evaluatedAt).getTime() > new Date(pack.expiresAt).getTime();
  const reasons: string[] = [];
  let effectiveState = pack.stateAtSave;

  if (expired) {
    effectiveState = "stale";
    reasons.push("Saved AccessCast expired while offline");
    reasons.push("Do not present this snapshot as the current outlook");
  } else {
    reasons.push("Offline snapshot still within expiry window");
    reasons.push("Sources listed as not refreshed may have changed");
  }

  const changedSinceSaved =
    expired ||
    pack.sourcesNotRefreshed.length > 0;

  return {
    pack,
    evaluatedAt,
    effectiveState,
    changedSinceSaved,
    expired,
    reasons,
    limitations: [
      ...pack.limitations,
      "Offline forecasts must show generated time, expiry, and unre refreshed sources",
      "Never silently present an offline forecast as current",
    ],
  };
}
