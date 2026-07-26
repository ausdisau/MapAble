import type { AccessEvidenceClass } from "../evidence/classes";
import type { TemporalAccessState } from "../temporal/vocabulary";

export type AccessGraphNodeKind =
  | "access_place"
  | "civic_asset"
  | "entrance"
  | "path"
  | "floor"
  | "room"
  | "door"
  | "lift"
  | "ramp"
  | "toilet"
  | "counter"
  | "transport_stop"
  | "curb_zone"
  | "evidence";

export type AccessGraphEdgeKind =
  | "contains"
  | "connects_to"
  | "requires"
  | "depends_on"
  | "observed_by"
  | "alternative_to"
  | "available_during"
  | "incompatible_with"
  | "requires_confirmation";

export type AccessGraphNode = {
  id: string;
  kind: AccessGraphNodeKind;
  label: string;
  canonicalRef: string | null;
  ontologyConceptIds: string[];
  properties: Record<string, string | number | boolean | null>;
  temporalState: TemporalAccessState;
  evidenceClass: AccessEvidenceClass;
  observedAt: string;
  publicPartition: boolean;
  listSummary: string;
};

export type AccessGraphEdge = {
  id: string;
  kind: AccessGraphEdgeKind;
  from: string;
  to: string;
  label: string;
  temporalState: TemporalAccessState;
  evidenceClass: AccessEvidenceClass;
  properties: Record<string, string | number | boolean | null>;
};

export type LivingAccessGraphSnapshot = {
  snapshotId: string;
  precinctId: string;
  precinctLabel: string;
  generatedAt: string;
  synthetic: true;
  nodes: AccessGraphNode[];
  edges: AccessGraphEdge[];
  limitations: string[];
};
