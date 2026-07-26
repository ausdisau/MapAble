import type { AccessEvidenceClass } from "../evidence/classes";
import type { AccessConclusionState } from "../results/states";
import type { TemporalAccessState } from "../temporal/vocabulary";

export type JourneySegmentKind =
  | "origin"
  | "local_path"
  | "pickup_curb"
  | "accessible_transport"
  | "interchange"
  | "destination_stop"
  | "drop_off"
  | "external_path"
  | "entrance"
  | "internal_route"
  | "destination_room"
  | "return_journey";

export type JourneySegment = {
  id: string;
  kind: JourneySegmentKind;
  label: string;
  fromNodeId: string | null;
  toNodeId: string | null;
  geometrySummary: string;
  accessibilityFeatures: string[];
  personalFit: AccessConclusionState;
  operationalState: TemporalAccessState;
  evidenceClass: AccessEvidenceClass;
  evidenceSummary: string;
  reliability: string | null;
  burdenNotes: string[];
  fallback: string | null;
  responsibleOrganisation: string;
  confirmationRequired: boolean;
  confirmationQuestion: string | null;
  hardDependency: boolean;
};

export type JourneyDependencyNode = {
  id: string;
  label: string;
  segmentId: string;
  hard: boolean;
  status: "ok" | "failed" | "unknown" | "excluded";
};

export type JourneyDependencyEdge = {
  id: string;
  from: string;
  to: string;
  kind: "requires" | "depends_on" | "fallback_for";
};

export type JourneyDependencyGraph = {
  nodes: JourneyDependencyNode[];
  edges: JourneyDependencyEdge[];
  singlePointsOfFailure: string[];
  unverifiedFallbacks: string[];
};

export type DoorToRoomPreflight = {
  preflightId: string;
  queryId: string;
  requirementSetRef: string;
  destinationRef: string;
  segments: JourneySegment[];
  dependencyGraph: JourneyDependencyGraph;
  overallConclusion: AccessConclusionState;
  matchedHardRequirements: string[];
  failedHardRequirements: string[];
  unresolvedHardRequirements: string[];
  excludedAlternatives: string[];
  suggestedConfirmations: string[];
  burden: {
    summary: string;
    attributedTo: string[];
    estimatedExtraSteps: number;
  };
  limitations: string[];
  returnJourneyEvaluated: boolean;
  operatingMode: "synthetic" | "shadow";
};
