export type UnderstandingEntityType =
  | "goal"
  | "routine"
  | "event"
  | "context"
  | "person"
  | "place"
  | "worker"
  | "informal_support";

export type StabilityTrend = "stable" | "declining" | "improving" | "unknown";

export type LivingArrangementRiskLevel = "low" | "moderate" | "high";

export type UnderstandingGraphNode = {
  id: string;
  entityType: UnderstandingEntityType;
  entityId: string;
  label: string;
  sourceClassification:
    | "canonical_record"
    | "participant_report"
    | "projection";
};

export type UnderstandingGraphEdgeView = {
  id: string;
  sourceType: UnderstandingEntityType;
  sourceId: string;
  targetType: UnderstandingEntityType;
  targetId: string;
  relationship: string;
};

export type ParticipantKnowledgeGraph = {
  participantId: string;
  nodes: UnderstandingGraphNode[];
  edges: UnderstandingGraphEdgeView[];
  builtAtIso: string;
  productionClaim: "none";
};

export type InformalSupportView = {
  id: string;
  participantId: string;
  supporterDisplayName: string;
  supporterUserId: string | null;
  relationshipLabel: string;
  capacityScore: number;
  stabilityTrend: StabilityTrend;
  notes: string | null;
};

export type LivingArrangementSignalView = {
  participantId: string;
  riskLevel: LivingArrangementRiskLevel;
  score: number;
  reasons: string[];
  /** Always true — navigational signal only; never an SDA eligibility determination. */
  informationalOnly: true;
  updatedAtIso: string;
};

export type RelationshipRiskPartial = {
  cascadingImpact?: number;
  irreversibility?: number;
  capabilityDependence?: number;
};

export interface RelationshipRiskEvaluator {
  id: string;
  evaluate(input: {
    participantId: string;
    informalSupports: InformalSupportView[];
    livingAloneHint?: boolean;
  }): RelationshipRiskPartial | Promise<RelationshipRiskPartial>;
}
