/**
 * MapAble Access Infrastructure — canonical domains, provenance, compatibility.
 * Foundational framework types. Not a universal accessibility score.
 */

/** Twenty canonical functional access domains (not impairment categories). */
export const ACCESS_DOMAINS = [
  "mobility_movement",
  "reach_strength_dexterity",
  "seating_stamina",
  "vision",
  "hearing",
  "speech_communication",
  "auslan_language",
  "cognition_learning",
  "executive_memory",
  "sensory_regulation",
  "psychosocial",
  "pain_fatigue_fluctuating",
  "self_care_continence",
  "equipment_at",
  "assistance_animals",
  "digital",
  "service_staff",
  "financial_admin",
  "transport",
  "emergency",
] as const;

export type AccessDomain = (typeof ACCESS_DOMAINS)[number];

/** Coarse ontology v1 domains retained for alias resolution. */
export const ONTOLOGY_DOMAINS_V1 = [
  "physical",
  "sensory",
  "cognitive_communication",
  "service",
  "digital",
  "transport",
] as const;

export type OntologyDomainV1 = (typeof ONTOLOGY_DOMAINS_V1)[number];

/** Map legacy v1 coarse domain → primary v2 access domain. */
export const V1_DOMAIN_TO_ACCESS_DOMAIN: Record<OntologyDomainV1, AccessDomain> = {
  physical: "mobility_movement",
  sensory: "sensory_regulation",
  cognitive_communication: "cognition_learning",
  service: "service_staff",
  digital: "digital",
  transport: "transport",
};

export const ACCESS_CRITICALITIES = ["required", "strong_preference", "preference"] as const;
export type AccessCriticality = (typeof ACCESS_CRITICALITIES)[number];

export const ACCESS_CONTEXT_SCOPES = ["always", "activity_specific", "journey_specific"] as const;
export type AccessContextScope = (typeof ACCESS_CONTEXT_SCOPES)[number];

export const ACCESS_TIMINGS = ["permanent", "temporary", "fluctuating"] as const;
export type AccessTiming = (typeof ACCESS_TIMINGS)[number];

export const ACCESS_ASSISTANCE_MODES = ["independent", "optional", "required"] as const;
export type AccessAssistanceMode = (typeof ACCESS_ASSISTANCE_MODES)[number];

export const ACCESS_DISCLOSURE_SCOPES = [
  "private",
  "service_provider",
  "worker",
  "employer",
  "venue",
  "transport_provider",
  "emergency",
  "support_coordinator",
] as const;
export type AccessDisclosureScope = (typeof ACCESS_DISCLOSURE_SCOPES)[number];

export const ACCESS_PROVENANCE_STATUSES = [
  "verified",
  "observed",
  "venue_reported",
  "community_reported",
  "unknown",
  "outdated",
  "disputed",
] as const;
export type AccessProvenanceStatus = (typeof ACCESS_PROVENANCE_STATUSES)[number];

export const ACCESS_COMPATIBILITY_STATES = [
  "compatible",
  "compatible_with_adjustment",
  "uncertain",
  "incompatible",
] as const;
export type AccessCompatibilityState = (typeof ACCESS_COMPATIBILITY_STATES)[number];

export const ACCESS_ENTITY_TYPES = [
  "place",
  "footpath",
  "transport_stop",
  "vehicle",
  "support_provider",
  "workplace",
  "school",
  "hospital",
  "event",
  "park",
  "accommodation",
  "digital_service",
  "path_segment",
  "entrance",
  "amenity",
  "other",
] as const;
export type AccessEntityType = (typeof ACCESS_ENTITY_TYPES)[number];

/** Whole-journey segments (Australian Whole Journey Guide aligned). */
export const ACCESS_JOURNEY_SEGMENT_KINDS = [
  "preparation",
  "origin",
  "path_to_transport",
  "pickup_or_station",
  "boarding",
  "vehicle",
  "interchange",
  "drop_off",
  "path_to_destination",
  "entrance",
  "internal_movement",
  "service_or_activity",
  "amenities",
  "return_journey",
] as const;
export type AccessJourneySegmentKind = (typeof ACCESS_JOURNEY_SEGMENT_KINDS)[number];

export const ACCESS_DOMAIN_LABELS: Record<AccessDomain, string> = {
  mobility_movement: "Mobility & movement",
  reach_strength_dexterity: "Reach, strength & dexterity",
  seating_stamina: "Seating & stamina",
  vision: "Vision",
  hearing: "Hearing",
  speech_communication: "Speech & communication",
  auslan_language: "Auslan & language",
  cognition_learning: "Cognition & learning",
  executive_memory: "Executive function & memory",
  sensory_regulation: "Sensory regulation",
  psychosocial: "Psychosocial access",
  pain_fatigue_fluctuating: "Pain, fatigue & fluctuating capacity",
  self_care_continence: "Self-care & continence",
  equipment_at: "Equipment & assistive technology",
  assistance_animals: "Assistance animals",
  digital: "Digital access",
  service_staff: "Service & staff access",
  financial_admin: "Financial/administrative access",
  transport: "Transport access",
  emergency: "Emergency access",
};
