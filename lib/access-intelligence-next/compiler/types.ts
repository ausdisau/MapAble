import type { AccessQueryConstraint } from "../query/ast";

export type RequirementKind =
  | "functional"
  | "safety_related"
  | "preference"
  | "comfort_preference"
  | "communication_preference"
  | "one_journey_override"
  | "temporary"
  | "supporter_supplied"
  | "professional_recommendation";

export type ParticipantRequirement = {
  ontologyConceptId: string;
  kind: RequirementKind;
  comparator?: AccessQueryConstraint["comparator"];
  value?: string | number | boolean;
  source: "participant" | "authorised_supporter" | "professional" | "fixture";
  notes?: string;
};

export type ParticipantRequirementSet = {
  id: string;
  version: string;
  participantRef: string;
  requirements: ParticipantRequirement[];
  /** Situational overrides for a single journey — cannot weaken hard constraints silently. */
  journeyOverrides?: ParticipantRequirement[];
};

export type CompiledAccessRequirement = {
  requirementSetRef: string;
  hardConstraints: AccessQueryConstraint[];
  preferences: AccessQueryConstraint[];
  exclusions: AccessQueryConstraint[];
  evidenceFreshnessDays: number | null;
  acceptableUncertainty: "none" | "limited" | "explicit_unknowns_ok";
  requiredConfirmation: string[];
  fallbackConditions: string[];
  communicationNeeds: string[];
  situationalOverrides: AccessQueryConstraint[];
  prohibitedWeakening: string[];
};
