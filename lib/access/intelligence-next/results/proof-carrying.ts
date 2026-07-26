import type { AccessEvidenceReference } from "../evidence/envelope";

import type { AccessConclusionState } from "./states";

export type AccessResultConstraint = {
  ontologyConceptId: string;
  kind: "require" | "prefer" | "avoid";
  status: "matched" | "failed" | "unresolved";
  detail: string;
};

export type AccessResultUnknown = {
  ontologyConceptId?: string;
  reason: string;
  suggestedConfirmation?: string;
};

export type ProofCarryingAccessResult = {
  resultId: string;
  queryId: string;
  requirementSetRef: string;
  conclusion: AccessConclusionState;
  matchedConstraints: AccessResultConstraint[];
  failedConstraints: AccessResultConstraint[];
  unresolvedConstraints: AccessResultConstraint[];
  evidenceReferences: AccessEvidenceReference[];
  evidenceClasses: string[];
  freshness: {
    oldestEvidenceAt: string | null;
    newestEvidenceAt: string | null;
    staleConceptIds: string[];
  };
  conflicts: string[];
  operationalState: string | null;
  reliability: string | null;
  assumptions: string[];
  excludedAlternatives: string[];
  participantBurden: {
    summary: string;
    attributedTo: string[];
  } | null;
  suggestedConfirmation: string[];
  unknowns: AccessResultUnknown[];
  validFrom: string;
  validTo: string | null;
  auditCorrelationId: string;
  limitations: string[];
  operatingMode: string;
};

export function createProofCarryingResult(
  input: Omit<ProofCarryingAccessResult, "evidenceClasses"> & {
    evidenceClasses?: string[];
  },
): ProofCarryingAccessResult {
  const classes = input.evidenceClasses ?? [
    ...new Set(input.evidenceReferences.map((e) => e.class)),
  ];
  return { ...input, evidenceClasses: classes };
}
