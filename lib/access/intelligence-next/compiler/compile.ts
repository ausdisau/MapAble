import type { AccessQueryConstraint } from "../query/ast";

import type {
  CompiledAccessRequirement,
  ParticipantRequirement,
  ParticipantRequirementSet,
} from "./types";

const HARD_KINDS = new Set([
  "functional",
  "safety_related",
  "temporary",
  "one_journey_override",
  "professional_recommendation",
]);

function toConstraint(r: ParticipantRequirement): AccessQueryConstraint {
  return {
    ontologyConceptId: r.ontologyConceptId,
    comparator: r.comparator,
    value: r.value,
  };
}

/**
 * Compile participant-selected requirements into hard constraints and preferences.
 * Never infers from diagnosis. Preferences cannot weaken hard constraints.
 */
export function compileParticipantRequirements(
  set: ParticipantRequirementSet,
): CompiledAccessRequirement {
  const hardConstraints: AccessQueryConstraint[] = [];
  const preferences: AccessQueryConstraint[] = [];
  const exclusions: AccessQueryConstraint[] = [];
  const communicationNeeds: string[] = [];
  const requiredConfirmation: string[] = [];
  const fallbackConditions: string[] = [];
  const prohibitedWeakening: string[] = [];

  const apply = (r: ParticipantRequirement, isOverride: boolean) => {
    if (r.kind === "communication_preference") {
      communicationNeeds.push(r.ontologyConceptId);
    }
    if (r.ontologyConceptId.endsWith("revolving_door") || r.value === false) {
      // explicit avoid patterns via false boolean on hazard concepts handled as exclusions below
    }
    if (HARD_KINDS.has(r.kind) || isOverride) {
      if (r.kind === "preference" || r.kind === "comfort_preference") {
        preferences.push(toConstraint(r));
        return;
      }
      hardConstraints.push(toConstraint(r));
      if (isOverride) {
        prohibitedWeakening.push(
          `Override ${r.ontologyConceptId} cannot be relaxed by preference optimisation`,
        );
      }
      return;
    }
    if (r.kind === "preference" || r.kind === "comfort_preference") {
      preferences.push(toConstraint(r));
      return;
    }
    if (r.kind === "supporter_supplied") {
      requiredConfirmation.push(
        `Confirm supporter-supplied requirement ${r.ontologyConceptId} with participant`,
      );
      hardConstraints.push(toConstraint(r));
    }
  };

  for (const r of set.requirements) apply(r, false);
  for (const r of set.journeyOverrides ?? []) apply(r, true);

  // Hazard concepts commonly avoided
  for (const c of hardConstraints) {
    if (
      c.ontologyConceptId === "physical.revolving_door" ||
      c.ontologyConceptId === "physical.staff_dependent_entrance"
    ) {
      exclusions.push({ ...c, value: true });
    }
  }

  fallbackConditions.push("Offer venue confirmation when hard constraints are unresolved");

  return {
    requirementSetRef: `${set.id}@${set.version}`,
    hardConstraints,
    preferences,
    exclusions,
    evidenceFreshnessDays: 90,
    acceptableUncertainty: "explicit_unknowns_ok",
    requiredConfirmation,
    fallbackConditions,
    communicationNeeds,
    situationalOverrides: (set.journeyOverrides ?? []).map(toConstraint),
    prohibitedWeakening,
  };
}
