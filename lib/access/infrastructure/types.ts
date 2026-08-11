import type {
  AccessAssistanceMode,
  AccessCompatibilityState,
  AccessContextScope,
  AccessCriticality,
  AccessDisclosureScope,
  AccessDomain,
  AccessEntityType,
  AccessJourneySegmentKind,
  AccessProvenanceStatus,
  AccessTiming,
} from "./domains";

export type AccessRequirement = {
  id: string;
  passportId: string;
  ontologyConceptId: string;
  domain: AccessDomain;
  attribute: string;
  comparator?: "eq" | "neq" | "gte" | "lte" | "gt" | "lt" | "includes";
  value?: string | number | boolean;
  unit?: string | null;
  criticality: AccessCriticality;
  contextScope: AccessContextScope;
  timing: AccessTiming;
  assistance: AccessAssistanceMode;
  disclosureScopes: AccessDisclosureScope[];
  userConfirmed: boolean;
  acceptableAdjustmentIds?: string[];
  notes?: string;
};

export type AccessCapability = {
  id: string;
  entityType: AccessEntityType;
  entityId: string;
  placeId?: string | null;
  ontologyConceptId: string;
  attribute: string;
  value: string | number | boolean;
  unit?: string | null;
  availabilityJson?: unknown;
  evidenceObservationId: string;
  status: AccessProvenanceStatus;
};

export type AccessObservation = {
  id: string;
  featureKey: string;
  ontologyConceptId: string;
  value: string | number | boolean;
  unit?: string | null;
  sourceType:
    | "trained_assessor"
    | "venue"
    | "community"
    | "operator"
    | "system"
    | "synthetic";
  observedAt: string;
  evidenceKinds: string[];
  verificationStatus: AccessProvenanceStatus;
  confidence?: number | null;
  reviewDue?: string | null;
  disputed: boolean;
  placeId?: string | null;
  entityType?: AccessEntityType | null;
  entityId?: string | null;
  evidenceEnvelopeId?: string | null;
  observerUserId?: string | null;
};

export type AccessAdjustment = {
  id: string;
  entityType: AccessEntityType;
  entityId: string;
  ontologyConceptId?: string | null;
  summary: string;
  description?: string | null;
  availabilityJson?: unknown;
  status: AccessProvenanceStatus;
};

export type AccessCompatibility = {
  id: string;
  passportId: string;
  entityType: AccessEntityType;
  entityId: string;
  journeyId?: string | null;
  state: AccessCompatibilityState;
  requiredMetConceptIds: string[];
  requiredUnmetConceptIds: string[];
  requiredUncertainConceptIds: string[];
  preferenceMetConceptIds: string[];
  preferenceUnmetConceptIds: string[];
  preferenceUncertainConceptIds: string[];
  adjustmentIds: string[];
  evidenceRefs: string[];
  limitations: string[];
  participantDecisionRequired: boolean;
  evaluatedAt: string;
};

export type AccessJourneySegment = {
  id: string;
  journeyId: string;
  kind: AccessJourneySegmentKind;
  sequence: number;
  entityType?: AccessEntityType | null;
  entityId?: string | null;
  placeId?: string | null;
  compatibilityState: AccessCompatibilityState;
  notes?: string | null;
};

export type AccessJourney = {
  id: string;
  passportId: string;
  goal: string;
  activity?: string | null;
  segments: AccessJourneySegment[];
  overallState: AccessCompatibilityState;
  limitations: string[];
  evaluatedAt: string;
};

export type AccessPassport = {
  id: string;
  userId: string;
  visibilityDefault: "private" | "request_scoped" | "approved_service";
  /** Always false on matching payloads — diagnosis is never a matching input. */
  containsDiagnosis: false;
  requirements: AccessRequirement[];
  createdAt: string;
  updatedAt: string;
};
