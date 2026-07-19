import { createEvidenceEnvelope } from "../evidence/envelope";
import type { AccessEvidenceReference } from "../evidence/envelope";
import { getHarbourGraph } from "../graph/harbour-fixture";
import type { AccessQueryAst } from "../query/ast";
import {
  createProofCarryingResult,
  type ProofCarryingAccessResult,
  type AccessResultConstraint,
  type AccessResultUnknown,
} from "../results";

function evidenceFromNode(
  nodeId: string,
  conceptId: string,
  summary: string,
  cls: AccessEvidenceReference["class"],
): AccessEvidenceReference {
  const node = getHarbourGraph().nodes.find((n) => n.id === nodeId);
  return {
    evidenceId: `ev:${nodeId}:${conceptId}`,
    class: cls,
    ontologyConceptId: conceptId,
    source: "harbour_synthetic_fixture",
    sourceVersion: "v1",
    observedAt: node?.observedAt ?? "2026-06-01T00:00:00.000Z",
    summary,
    limitations: ["Synthetic fixture — not a production claim"],
  };
}

/**
 * Synthetic door-to-room journey preflight for Harbour Room 3.12.
 * Preserves unknowns (lift ops, corridor width) and excludes staff-only entrance.
 * Returns cannot_confirm rather than compatible when hard requirements are unresolved.
 */
export function runSyntheticJourneyPreflight(
  query: AccessQueryAst,
  requirementSetRef: string,
): ProofCarryingAccessResult {
  const now = new Date().toISOString();
  const matched: AccessResultConstraint[] = [];
  const failed: AccessResultConstraint[] = [];
  const unresolved: AccessResultConstraint[] = [];
  const unknowns: AccessResultUnknown[] = [];
  const evidence: AccessEvidenceReference[] = [];
  const suggestedConfirmation: string[] = [];
  const excludedAlternatives: string[] = [];

  const avoidStaff = query.avoid.some(
    (c) => c.ontologyConceptId === "physical.staff_dependent_entrance",
  );
  if (avoidStaff) {
    excludedAlternatives.push("harbour_civic.entrance_staff (staff-dependent entrance)");
    matched.push({
      ontologyConceptId: "physical.staff_dependent_entrance",
      kind: "avoid",
      status: "matched",
      detail: "Staff-dependent entrance excluded from candidate routes",
    });
  }

  // Western entrance width
  const widthReq = query.require.find(
    (c) => c.ontologyConceptId === "physical.minimum_clear_width_mm",
  );
  const minWidth = typeof widthReq?.value === "number" ? widthReq.value : 850;
  const entranceWidth = 910;
  if (entranceWidth >= minWidth) {
    matched.push({
      ontologyConceptId: "physical.minimum_clear_width_mm",
      kind: "require",
      status: "matched",
      detail: `Western entrance measured at ${entranceWidth} mm (requires ≥ ${minWidth} mm)`,
    });
    evidence.push(
      evidenceFromNode(
        "harbour_civic.entrance_west",
        "physical.minimum_clear_width_mm",
        `Western entrance clear width ${entranceWidth} mm`,
        "independently_verified_claim",
      ),
    );
  } else {
    failed.push({
      ontologyConceptId: "physical.minimum_clear_width_mm",
      kind: "require",
      status: "failed",
      detail: `Entrance width ${entranceWidth} mm below required ${minWidth} mm`,
    });
  }

  if (query.require.some((c) => c.ontologyConceptId === "physical.step_free")) {
    matched.push({
      ontologyConceptId: "physical.step_free",
      kind: "require",
      status: "matched",
      detail: "Step-free external path and western entrance present in fixture",
    });
    evidence.push(
      evidenceFromNode(
        "harbour_civic.path_external",
        "physical.step_free",
        "External approach path is step-free",
        "synthetic_fixture",
      ),
    );
  }

  if (query.require.some((c) => c.ontologyConceptId === "physical.accessible_toilet")) {
    matched.push({
      ontologyConceptId: "physical.accessible_toilet",
      kind: "require",
      status: "matched",
      detail: "Level 3 accessible toilet confirmed by venue declaration (synthetic)",
    });
    evidence.push(
      evidenceFromNode(
        "harbour_civic.toilet_3",
        "physical.accessible_toilet",
        "Accessible toilet on level 3",
        "venue_declaration",
      ),
    );
  }

  // Lift operational — unknown
  if (query.require.some((c) => c.ontologyConceptId === "physical.lift_operational")) {
    unresolved.push({
      ontologyConceptId: "physical.lift_operational",
      kind: "require",
      status: "unresolved",
      detail: "Lift A operational status is not live",
    });
    unknowns.push({
      ontologyConceptId: "physical.lift_operational",
      reason: "Lift status is not live in the synthetic fixture",
      suggestedConfirmation: "Ask venue to confirm Lift A is in service at arrival time",
    });
    suggestedConfirmation.push("Confirm Lift A operational status before travel");
    evidence.push(
      evidenceFromNode(
        "harbour_civic.lift_a",
        "physical.lift_operational",
        "Lift operational state unknown",
        "synthetic_fixture",
      ),
    );
  }

  // Corridor width unknown — even if not explicitly required, journey to room needs it
  unresolved.push({
    ontologyConceptId: "physical.minimum_clear_width_mm",
    kind: "require",
    status: "unresolved",
    detail: "Level 3 corridor clear width is unresolved",
  });
  unknowns.push({
    ontologyConceptId: "physical.minimum_clear_width_mm",
    reason: "Corridor clear width on level 3 has not been measured",
    suggestedConfirmation: "Request venue confirmation of corridor clear width to Room 3.12",
  });
  suggestedConfirmation.push("Confirm level 3 corridor clear width ≥ participant requirement");

  if (query.require.some((c) => c.ontologyConceptId === "cognitive_communication.plain_language")) {
    matched.push({
      ontologyConceptId: "cognitive_communication.plain_language",
      kind: "require",
      status: "matched",
      detail: "Written step list available for synthetic preflight",
    });
  }

  const envelope = createEvidenceEnvelope({
    envelopeId: `env:${query.id}`,
    subjectCanonicalRef: query.to ?? "harbour_civic.room_3_12",
    references: evidence,
  });

  const conclusion =
    failed.length > 0
      ? "blocked_by_hard_requirement"
      : unresolved.length > 0
        ? "cannot_confirm"
        : "likely_compatible";

  return createProofCarryingResult({
    resultId: `result:${query.id}:${Date.now()}`,
    queryId: query.id,
    requirementSetRef,
    conclusion,
    matchedConstraints: matched,
    failedConstraints: failed,
    unresolvedConstraints: unresolved,
    evidenceReferences: envelope.references,
    freshness: {
      oldestEvidenceAt: OBSERVED_MIN(evidence),
      newestEvidenceAt: OBSERVED_MAX(evidence),
      staleConceptIds: [],
    },
    conflicts: [],
    operationalState: "lift_operational_unknown",
    reliability: null,
    assumptions: [
      "Synthetic Harbour precinct fixture",
      "Return journey not evaluated in this foundation preflight",
    ],
    excludedAlternatives,
    participantBurden: {
      summary: "Venue confirmation calls may be required for lift and corridor width",
      attributedTo: ["venue_confirmation_workflow", "missing_operational_feed"],
    },
    suggestedConfirmation,
    unknowns,
    validFrom: now,
    validTo: null,
    auditCorrelationId: `audit:${query.id}`,
    limitations: [
      "Synthetic evaluation only",
      "Temporary construction conditions have not been checked",
      "Model confidence is not truth",
      "A route found is not a journey completed",
    ],
    operatingMode: "synthetic",
  });
}

function OBSERVED_MIN(refs: AccessEvidenceReference[]): string | null {
  if (refs.length === 0) return null;
  return refs.map((r) => r.observedAt).sort()[0] ?? null;
}

function OBSERVED_MAX(refs: AccessEvidenceReference[]): string | null {
  if (refs.length === 0) return null;
  return refs.map((r) => r.observedAt).sort().at(-1) ?? null;
}

/** Taylor Scenario A fixture query. */
export function taylorRoom312Query(): AccessQueryAst {
  return {
    id: "q-taylor-room-3-12",
    version: "1.0.0",
    target: "journey",
    from: "participant.home",
    to: "harbour_civic.room_3_12",
    require: [
      { ontologyConceptId: "physical.step_free", value: true },
      {
        ontologyConceptId: "physical.minimum_clear_width_mm",
        comparator: "gte",
        value: 850,
      },
      { ontologyConceptId: "physical.lift_operational", value: true },
      { ontologyConceptId: "physical.accessible_toilet", value: true },
      { ontologyConceptId: "cognitive_communication.plain_language", value: true },
    ],
    prefer: [],
    avoid: [{ ontologyConceptId: "physical.staff_dependent_entrance", value: true }],
    at: "2026-09-17T08:30:00+10:00",
    evidenceFreshnessDays: 90,
    participantEditableSummary:
      "Step-free journey to Room 3.12 with at least 850 mm clear width, working lift, accessible toilet, written directions; avoid staff-only entrance.",
  };
}
