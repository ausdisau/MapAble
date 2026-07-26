export type OntologyDataType =
  | "boolean"
  | "number"
  | "enum"
  | "text"
  | "dimension"
  | "duration";

export type OntologyDomain =
  | "physical"
  | "sensory"
  | "cognitive_communication"
  | "service"
  | "digital"
  | "transport";

export type PersonalFitBehaviour =
  | "hard_constraint_when_required"
  | "preference_only"
  | "evidence_freshness_gate"
  | "informational";

export type AccessOntologyConcept = {
  id: string;
  version: string;
  domain: OntologyDomain;
  definition: string;
  dataType: OntologyDataType;
  unit: string | null;
  evidenceRequirements: string[];
  personalFitBehaviour: PersonalFitBehaviour;
  standardsMappings: string[];
  permittedInference: string[];
  prohibitedInference: string[];
  reviewOwner: string;
  deprecationPathway: string | null;
  defaultFreshnessDays: number;
  enumValues?: string[];
};

export type AccessOntologyVersion = {
  version: string;
  publishedAt: string;
  concepts: AccessOntologyConcept[];
};
