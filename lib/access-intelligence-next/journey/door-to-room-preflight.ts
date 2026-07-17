import { createProofCarryingResult, type ProofCarryingAccessResult } from "../results";
import type { AccessQueryAst } from "../query/ast";
import { runSyntheticJourneyPreflight } from "./synthetic-preflight";
import type {
  DoorToRoomPreflight,
  JourneyDependencyGraph,
  JourneySegment,
} from "./segments";

/**
 * Proof-carrying door-to-room journey preflight for Harbour Room 3.12.
 * Models origin → curb → entrance → lift → corridor → room (+ return stub).
 * Does not stop at street address. Does not execute external actions.
 */
export function runDoorToRoomPreflight(input: {
  query: AccessQueryAst;
  requirementSetRef: string;
}): { preflight: DoorToRoomPreflight; proof: ProofCarryingAccessResult } {
  const proof = runSyntheticJourneyPreflight(input.query, input.requirementSetRef);
  const segments = buildHarbourSegments(proof.conclusion);
  const dependencyGraph = buildDependencyGraph(segments);

  const unresolvedHardRequirements = proof.unresolvedConstraints.map(
    (c) => c.ontologyConceptId,
  );
  const matchedHardRequirements = proof.matchedConstraints
    .filter((c) => c.kind === "require" || c.kind === "avoid")
    .map((c) => c.ontologyConceptId);
  const failedHardRequirements = proof.failedConstraints.map((c) => c.ontologyConceptId);

  const preflight: DoorToRoomPreflight = {
    preflightId: `preflight:${input.query.id}`,
    queryId: input.query.id,
    requirementSetRef: input.requirementSetRef,
    destinationRef: input.query.to ?? "harbour_civic.room_3_12",
    segments,
    dependencyGraph,
    overallConclusion: proof.conclusion,
    matchedHardRequirements,
    failedHardRequirements,
    unresolvedHardRequirements,
    excludedAlternatives: proof.excludedAlternatives,
    suggestedConfirmations: proof.suggestedConfirmation,
    burden: {
      summary:
        proof.participantBurden?.summary ??
        "Confirmation burden attributed to missing operational feeds",
      attributedTo: proof.participantBurden?.attributedTo ?? ["system"],
      estimatedExtraSteps: proof.suggestedConfirmation.length,
    },
    limitations: [
      ...proof.limitations,
      "Return journey stubbed as unevaluated — not assumed available",
      "Outdoor transport link is synthetic and not a live booking",
      "A route found is not a journey completed",
    ],
    returnJourneyEvaluated: false,
    operatingMode: "synthetic",
  };

  // Enrich proof with segment-aware assumptions
  const enrichedProof = createProofCarryingResult({
    ...proof,
    assumptions: [
      ...proof.assumptions,
      `Door-to-room segments evaluated: ${segments.length}`,
      `Single points of failure: ${dependencyGraph.singlePointsOfFailure.join(", ") || "none listed"}`,
    ],
    participantBurden: {
      summary: preflight.burden.summary,
      attributedTo: preflight.burden.attributedTo,
    },
  });

  return { preflight, proof: enrichedProof };
}

function buildHarbourSegments(
  overall: DoorToRoomPreflight["overallConclusion"],
): JourneySegment[] {
  const fitForKnown =
    overall === "blocked_by_hard_requirement" ? "incompatible" : "likely_compatible";

  return [
    {
      id: "seg-origin",
      kind: "origin",
      label: "Participant origin (home)",
      fromNodeId: null,
      toNodeId: "harbour_civic.stop_ferry",
      geometrySummary: "Private origin — not published",
      accessibilityFeatures: [],
      personalFit: "requires_confirmation",
      operationalState: "unknown",
      evidenceClass: "participant_observation",
      evidenceSummary: "Origin details remain private by default",
      reliability: null,
      burdenNotes: [],
      fallback: null,
      responsibleOrganisation: "participant",
      confirmationRequired: false,
      confirmationQuestion: null,
      hardDependency: true,
    },
    {
      id: "seg-stop",
      kind: "destination_stop",
      label: "Harbour ferry stop",
      fromNodeId: "harbour_civic.stop_ferry",
      toNodeId: "harbour_civic.curb_west",
      geometrySummary: "Accessible berth to west curb",
      accessibilityFeatures: ["transport.accessible_vehicle", "physical.step_free"],
      personalFit: fitForKnown,
      operationalState: "current",
      evidenceClass: "synthetic_fixture",
      evidenceSummary: "Synthetic step-free berth",
      reliability: "cannot_forecast",
      burdenNotes: [],
      fallback: null,
      responsibleOrganisation: "transport_operator_synthetic",
      confirmationRequired: false,
      confirmationQuestion: null,
      hardDependency: true,
    },
    {
      id: "seg-curb",
      kind: "pickup_curb",
      label: "West curb transition",
      fromNodeId: "harbour_civic.curb_west",
      toNodeId: "harbour_civic.path_external",
      geometrySummary: "Sealed step-free curb",
      accessibilityFeatures: ["physical.step_free"],
      personalFit: "likely_compatible",
      operationalState: "current",
      evidenceClass: "synthetic_fixture",
      evidenceSummary: "Synthetic curb transition",
      reliability: null,
      burdenNotes: [],
      fallback: null,
      responsibleOrganisation: "council_synthetic",
      confirmationRequired: false,
      confirmationQuestion: null,
      hardDependency: true,
    },
    {
      id: "seg-external",
      kind: "external_path",
      label: "External approach path",
      fromNodeId: "harbour_civic.path_external",
      toNodeId: "harbour_civic.entrance_west",
      geometrySummary: "1800 mm clear width, step-free",
      accessibilityFeatures: ["physical.step_free", "physical.minimum_clear_width_mm"],
      personalFit: "likely_compatible",
      operationalState: "current",
      evidenceClass: "synthetic_fixture",
      evidenceSummary: "External path fixture",
      reliability: null,
      burdenNotes: [],
      fallback: null,
      responsibleOrganisation: "harbour_civic_venue",
      confirmationRequired: false,
      confirmationQuestion: null,
      hardDependency: true,
    },
    {
      id: "seg-entrance",
      kind: "entrance",
      label: "Western entrance (910 mm)",
      fromNodeId: "harbour_civic.entrance_west",
      toNodeId: "harbour_civic.door_lobby",
      geometrySummary: "Step-free entrance, 910 mm clear width",
      accessibilityFeatures: [
        "physical.step_free",
        "physical.minimum_clear_width_mm",
      ],
      personalFit: "compatible",
      operationalState: "current",
      evidenceClass: "independently_verified_claim",
      evidenceSummary: "Western entrance independently verified (synthetic)",
      reliability: null,
      burdenNotes: [],
      fallback: "Staff entrance excluded by participant avoid rule",
      responsibleOrganisation: "harbour_civic_venue",
      confirmationRequired: false,
      confirmationQuestion: null,
      hardDependency: true,
    },
    {
      id: "seg-lift",
      kind: "internal_route",
      label: "Lift A to level 3",
      fromNodeId: "harbour_civic.lift_a",
      toNodeId: "harbour_civic.floor_3",
      geometrySummary: "Vertical circulation via Lift A",
      accessibilityFeatures: ["physical.lift_operational", "physical.step_free"],
      personalFit: "operational_status_unknown",
      operationalState: "unknown",
      evidenceClass: "synthetic_fixture",
      evidenceSummary: "Lift operational status not live",
      reliability: "cannot_forecast",
      burdenNotes: ["Requires venue confirmation call"],
      fallback: "No verified step-free alternative to level 3 in fixture",
      responsibleOrganisation: "harbour_civic_venue",
      confirmationRequired: true,
      confirmationQuestion: "Is Lift A in service at the planned arrival time?",
      hardDependency: true,
    },
    {
      id: "seg-corridor",
      kind: "internal_route",
      label: "Level 3 corridor",
      fromNodeId: "harbour_civic.corridor_3",
      toNodeId: "harbour_civic.room_3_12",
      geometrySummary: "Corridor clear width unresolved",
      accessibilityFeatures: ["physical.minimum_clear_width_mm", "physical.step_free"],
      personalFit: "cannot_confirm",
      operationalState: "unknown",
      evidenceClass: "synthetic_fixture",
      evidenceSummary: "Corridor width not measured",
      reliability: null,
      burdenNotes: ["Venue confirmation required"],
      fallback: null,
      responsibleOrganisation: "harbour_civic_venue",
      confirmationRequired: true,
      confirmationQuestion: "Is the level 3 corridor clear width at least 850 mm?",
      hardDependency: true,
    },
    {
      id: "seg-room",
      kind: "destination_room",
      label: "Room 3.12",
      fromNodeId: "harbour_civic.room_3_12",
      toNodeId: null,
      geometrySummary: "Destination room",
      accessibilityFeatures: ["physical.step_free", "physical.accessible_toilet"],
      personalFit: "likely_compatible",
      operationalState: "current",
      evidenceClass: "synthetic_fixture",
      evidenceSummary: "Room + nearby accessible toilet (venue declaration)",
      reliability: null,
      burdenNotes: [],
      fallback: null,
      responsibleOrganisation: "harbour_civic_venue",
      confirmationRequired: false,
      confirmationQuestion: null,
      hardDependency: true,
    },
    {
      id: "seg-return",
      kind: "return_journey",
      label: "Return journey",
      fromNodeId: "harbour_civic.room_3_12",
      toNodeId: null,
      geometrySummary: "Return path not evaluated",
      accessibilityFeatures: [],
      personalFit: "participant_goal_not_yet_verified",
      operationalState: "unknown",
      evidenceClass: "synthetic_fixture",
      evidenceSummary: "Return journey availability unknown",
      reliability: null,
      burdenNotes: ["Missing return evaluation increases journey risk"],
      fallback: null,
      responsibleOrganisation: "multi",
      confirmationRequired: true,
      confirmationQuestion: "Is an accessible return journey available at the planned departure time?",
      hardDependency: true,
    },
  ];
}

function buildDependencyGraph(segments: JourneySegment[]): JourneyDependencyGraph {
  const nodes = segments.map((s) => ({
    id: `dep:${s.id}`,
    label: s.label,
    segmentId: s.id,
    hard: s.hardDependency,
    status:
      s.personalFit === "compatible" || s.personalFit === "likely_compatible"
        ? ("ok" as const)
        : s.personalFit === "incompatible" || s.personalFit === "blocked_by_hard_requirement"
          ? ("failed" as const)
          : s.personalFit === "cannot_confirm" ||
              s.personalFit === "operational_status_unknown" ||
              s.personalFit === "participant_goal_not_yet_verified"
            ? ("unknown" as const)
            : ("unknown" as const),
  }));

  const edges = segments.slice(0, -1).map((s, i) => ({
    id: `dep-e-${i}`,
    from: `dep:${s.id}`,
    to: `dep:${segments[i + 1]!.id}`,
    kind: "depends_on" as const,
  }));

  const singlePointsOfFailure = segments
    .filter((s) => s.hardDependency && (!s.fallback || s.fallback.toLowerCase().includes("no verified")))
    .filter((s) => s.confirmationRequired || s.operationalState === "unknown")
    .map((s) => s.label);

  const unverifiedFallbacks = segments
    .filter((s) => s.fallback && /unverified|excluded|no verified/i.test(s.fallback))
    .map((s) => s.fallback!)
    .filter(Boolean);

  return {
    nodes,
    edges,
    singlePointsOfFailure,
    unverifiedFallbacks,
  };
}
