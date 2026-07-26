export type AccessQueryTarget =
  | "place"
  | "feature"
  | "indoor_route"
  | "journey"
  | "service_dependency"
  | "temporal"
  | "evidence"
  | "reliability"
  | "counterfactual"
  | "remediation"
  | "regional";

export type AccessQueryComparator = "eq" | "gte" | "lte" | "gt" | "lt" | "neq";

export type AccessQueryConstraint = {
  ontologyConceptId: string;
  comparator?: AccessQueryComparator;
  value?: string | number | boolean;
};

export type AccessQueryAst = {
  id: string;
  version: string;
  target: AccessQueryTarget;
  from?: string;
  to?: string;
  require: AccessQueryConstraint[];
  prefer: AccessQueryConstraint[];
  avoid: AccessQueryConstraint[];
  at?: string;
  evidenceFreshnessDays?: number;
  participantEditableSummary: string;
};

export const ACCESS_QUERY_AST_VERSION = "1.0.0";
