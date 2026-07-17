import { compileParticipantRequirements } from "../compiler/compile";
import type { ParticipantRequirementSet } from "../compiler/types";
import { getHarbourGraph, projectGraphToList } from "../graph";
import { runSyntheticJourneyPreflight } from "../journey/synthetic-preflight";
import type { ProofCarryingAccessResult } from "../results";
import { accessIntelligenceNextFlags } from "../flags";
import type { AccessQueryAst } from "./ast";
import { validateAccessQuery } from "./validate";

export type AccessQueryExecutionResult = {
  validationOk: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  result: ProofCarryingAccessResult | null;
  graphListAlternative?: ReturnType<typeof projectGraphToList>;
  auditEvent: string;
};

export function executeAccessQuery(input: {
  query: AccessQueryAst;
  requirementSet?: ParticipantRequirementSet;
}): AccessQueryExecutionResult {
  if (!accessIntelligenceNextFlags.allowSyntheticExecution) {
    return {
      validationOk: false,
      validationErrors: [
        "Access Intelligence Next is disabled or mode does not allow synthetic execution",
      ],
      validationWarnings: [],
      result: null,
      auditEvent: "access.query_executed",
    };
  }

  const validation = validateAccessQuery(input.query);
  if (!validation.ok) {
    return {
      validationOk: false,
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
      result: null,
      auditEvent: "access.query_validated",
    };
  }

  const compiled = input.requirementSet
    ? compileParticipantRequirements(input.requirementSet)
    : null;

  const requirementSetRef =
    compiled?.requirementSetRef ?? `inline:${input.query.id}`;

  if (input.query.target === "journey" || input.query.target === "indoor_route") {
    const result = runSyntheticJourneyPreflight(input.query, requirementSetRef);
    return {
      validationOk: true,
      validationErrors: [],
      validationWarnings: validation.warnings,
      result,
      graphListAlternative: projectGraphToList(getHarbourGraph()),
      auditEvent: "access.journey_preflight_completed",
    };
  }

  // Place / feature queries: return graph-backed cannot_confirm envelope without inventing fit
  const result = runSyntheticJourneyPreflight(
    { ...input.query, target: "journey", from: input.query.from ?? "origin", to: input.query.to ?? "harbour_civic.place" },
    requirementSetRef,
  );

  return {
    validationOk: true,
    validationErrors: [],
    validationWarnings: [
      ...validation.warnings,
      "Non-journey targets currently resolve via synthetic Harbour projection only",
    ],
    result,
    graphListAlternative: projectGraphToList(getHarbourGraph()),
    auditEvent: "access.query_executed",
  };
}
