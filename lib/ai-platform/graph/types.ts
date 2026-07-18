/**
 * Semantic evidence layer over canonical MapAble relationships.
 * Not a second mission source of truth.
 */

export type EvidenceSourceClassification =
  | "canonical_record"
  | "mission_projection"
  | "participant_report"
  | "provider_report"
  | "model_candidate"
  | "synthetic_fixture";

export type EvidenceGraphNodeRef = {
  id: string;
  domain: string;
  entity: string;
  entityId: string;
  version: string;
  tenantId: string;
  participantScopeId: string | null;
  sourceClassification: EvidenceSourceClassification;
  freshnessIso: string;
  label: string;
};

export type EvidenceGraphEdgeKind =
  | "authoritative"
  | "candidate";

export type EvidenceGraphEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationship: string;
  kind: EvidenceGraphEdgeKind;
  evidenceRefs: string[];
  effectiveAtIso: string | null;
  expiresAtIso: string | null;
  conflictState: "none" | "conflict" | "stale" | "unknown";
  /** Model-generated edges require human review before use as authoritative. */
  humanReviewRequired: boolean;
};

export type MissionEvidenceGraph = {
  missionKey: string;
  missionInstanceId: string;
  tenantId: string;
  participantScopeId: string | null;
  nodes: EvidenceGraphNodeRef[];
  edges: EvidenceGraphEdge[];
  builtAtIso: string;
  productionClaim: "none";
};
