export {
  ACCESS_ASSISTANCE_MODES,
  ACCESS_COMPATIBILITY_STATES,
  ACCESS_CONTEXT_SCOPES,
  ACCESS_CRITICALITIES,
  ACCESS_DISCLOSURE_SCOPES,
  ACCESS_DOMAIN_LABELS,
  ACCESS_DOMAINS,
  ACCESS_ENTITY_TYPES,
  ACCESS_JOURNEY_SEGMENT_KINDS,
  ACCESS_PROVENANCE_STATUSES,
  ACCESS_TIMINGS,
  ONTOLOGY_DOMAINS_V1,
  V1_DOMAIN_TO_ACCESS_DOMAIN,
} from "./domains";
export type {
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
  OntologyDomainV1,
} from "./domains";

export type {
  AccessAdjustment,
  AccessCapability,
  AccessCompatibility,
  AccessJourney,
  AccessJourneySegment,
  AccessObservation,
  AccessPassport,
  AccessRequirement,
} from "./types";

export { isDecisiveCompatibility, mapConclusionToCompatibility } from "./compatibility";
export { accessInfrastructureFlags } from "./flags";
