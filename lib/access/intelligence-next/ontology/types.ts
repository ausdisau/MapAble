import type { AccessDomain, OntologyDomainV1 } from "@/lib/access/infrastructure/domains";

export type OntologyDataType =
  | "boolean"
  | "number"
  | "enum"
  | "text"
  | "dimension"
  | "duration";

/** Coarse v1 domains or fine-grained Access Infrastructure domains. */
export type OntologyDomain = AccessDomain | OntologyDomainV1;

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
  /** Prefer this Access Infrastructure domain when domain is a v1 coarse value. */
  accessDomain?: AccessDomain;
  /** Stable aliases (e.g. v1 id) that resolve to this concept. */
  aliases?: string[];
};

export type AccessOntologyVersion = {
  version: string;
  publishedAt: string;
  concepts: AccessOntologyConcept[];
  framework?: "access_as_infrastructure";
};
