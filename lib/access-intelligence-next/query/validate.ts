import { getOntologyConcept } from "../ontology/seed-v1";
import type { AccessQueryAst, AccessQueryConstraint } from "./ast";
import { ACCESS_QUERY_AST_VERSION } from "./ast";

export type AccessQueryValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  query: AccessQueryAst;
};

function validateConstraint(
  c: AccessQueryConstraint,
  bucket: "require" | "prefer" | "avoid",
  errors: string[],
): void {
  if (!c.ontologyConceptId?.trim()) {
    errors.push(`${bucket}: missing ontologyConceptId`);
    return;
  }
  const concept = getOntologyConcept(c.ontologyConceptId);
  if (!concept) {
    errors.push(`${bucket}: unknown ontology concept ${c.ontologyConceptId}`);
    return;
  }
  if (concept.dataType === "dimension" || concept.dataType === "number") {
    if (bucket === "require" && c.comparator == null) {
      errors.push(`${bucket}: ${c.ontologyConceptId} requires a comparator`);
    }
    if (c.comparator && typeof c.value !== "number") {
      errors.push(`${bucket}: ${c.ontologyConceptId} requires a numeric value`);
    }
  }
}

/**
 * Schema validation for AQL AST. Injection-resistant: no string eval; typed AST only.
 */
export function validateAccessQuery(query: AccessQueryAst): AccessQueryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!query.id?.trim()) errors.push("query.id is required");
  if (query.version !== ACCESS_QUERY_AST_VERSION) {
    warnings.push(`query.version ${query.version} differs from supported ${ACCESS_QUERY_AST_VERSION}`);
  }
  if (!query.target) errors.push("query.target is required");
  if (!query.participantEditableSummary?.trim()) {
    errors.push("participantEditableSummary is required so participants can inspect requirements");
  }
  if (query.target === "journey") {
    if (!query.from?.trim()) errors.push("journey queries require from");
    if (!query.to?.trim()) errors.push("journey queries require to");
  }
  if (query.at && Number.isNaN(Date.parse(query.at))) {
    errors.push("query.at must be an ISO-8601 timestamp when provided");
  }
  if (
    query.evidenceFreshnessDays != null &&
    (query.evidenceFreshnessDays < 0 || !Number.isFinite(query.evidenceFreshnessDays))
  ) {
    errors.push("evidenceFreshnessDays must be a non-negative finite number");
  }

  for (const c of query.require) validateConstraint(c, "require", errors);
  for (const c of query.prefer) validateConstraint(c, "prefer", errors);
  for (const c of query.avoid) validateConstraint(c, "avoid", errors);

  if (query.require.length === 0 && query.avoid.length === 0) {
    warnings.push("query has no hard REQUIRE or AVOID constraints");
  }

  return { ok: errors.length === 0, errors, warnings, query };
}
