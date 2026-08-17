import { missionGraphConfig } from "@/lib/config/mission-graph";
import { buildStartingWorkDependencyGraph } from "@/lib/pilot/starting-work/dependency-graph";
import type { GoldenJourneyState } from "@/lib/pilot/starting-work/golden-journey";

import type {
  EvidenceGraphEdge,
  EvidenceGraphNodeRef,
  MissionEvidenceGraph,
} from "./types";

/**
 * Canonical relationship adapter for Starting Work only.
 * Authoritative edges come from the dependency graph; never invent operational writes.
 */
export function buildStartingWorkEvidenceGraph(input: {
  state: GoldenJourneyState;
  tenantId: string;
  participantScopeId: string | null;
  nowIso?: string;
}): MissionEvidenceGraph {
  if (!missionGraphConfig.graphEnabled) {
    throw new Error("MAPABLE_MISSION_GRAPH_ENABLED is false");
  }
  if (
    !missionGraphConfig.allowedMissionKeys.includes("mission.starting_work")
  ) {
    throw new Error("Mission key not allowed for evidence graph");
  }

  const now = input.nowIso ?? new Date().toISOString();
  const dep = buildStartingWorkDependencyGraph({
    blocked: input.state.blocked,
    failureMode: input.state.failureMode,
    stepsCompleted: input.state.stepsCompleted,
  });

  const nodes: EvidenceGraphNodeRef[] = dep.nodes.map((node) => ({
    id: `node:${node.id}`,
    domain: domainForKind(node.kind),
    entity: node.kind,
    entityId: node.entityRef ?? `synthetic:${node.id}`,
    version: "starting-work-dep-v1",
    tenantId: input.tenantId,
    participantScopeId: input.participantScopeId,
    sourceClassification: node.entityRef?.startsWith("synthetic:")
      ? "synthetic_fixture"
      : "canonical_record",
    freshnessIso: now,
    label: `${node.label} (${node.state})`,
  }));

  const edges: EvidenceGraphEdge[] = dep.edges.map((edge, index) => ({
    id: `edge:${index}:${edge.from}->${edge.to}`,
    sourceNodeId: `node:${edge.from}`,
    targetNodeId: `node:${edge.to}`,
    relationship: edge.relation,
    kind: "authoritative",
    evidenceRefs: [`dep:${edge.from}:${edge.to}:${edge.relation}`],
    effectiveAtIso: now,
    expiresAtIso: null,
    conflictState:
      input.state.blocked && (edge.from === "care" || edge.to === "care")
        ? "conflict"
        : "none",
    humanReviewRequired: false,
  }));

  return {
    missionKey: "mission.starting_work",
    missionInstanceId: input.state.journeyId,
    tenantId: input.tenantId,
    participantScopeId: input.participantScopeId,
    nodes,
    edges,
    builtAtIso: now,
    productionClaim: "none",
  };
}

/**
 * Candidate (non-authoritative) edge — must not be treated as graph truth.
 */
export function proposeCandidateEdge(input: {
  sourceNodeId: string;
  targetNodeId: string;
  relationship: string;
  evidenceRefs: string[];
  nowIso?: string;
}): EvidenceGraphEdge {
  const now = input.nowIso ?? new Date().toISOString();
  return {
    id: `candidate:${input.sourceNodeId}->${input.targetNodeId}:${input.relationship}`,
    sourceNodeId: input.sourceNodeId,
    targetNodeId: input.targetNodeId,
    relationship: input.relationship,
    kind: "candidate",
    evidenceRefs: input.evidenceRefs,
    effectiveAtIso: now,
    expiresAtIso: null,
    conflictState: "unknown",
    humanReviewRequired: true,
  };
}

function domainForKind(kind: string): string {
  switch (kind) {
    case "care_shift":
      return "care";
    case "transport_quote":
    case "transport_trip":
    case "return_journey":
      return "transport";
    case "venue_entrance":
    case "indoor_route":
      return "access";
    case "billing_evidence":
      return "billing";
    case "worker_readiness":
      return "workforce";
    case "communication_passport":
    case "visit_pack":
      return "companion";
    case "equipment":
      return "equipment";
    case "outcome_review":
    case "participant_goal":
      return "mission";
    default:
      return "mission";
  }
}
