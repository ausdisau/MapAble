import type { FloorPlanFeatureType } from "@/lib/access/floor-plan/schemas";

export type FeatureCategory =
  | "entrances"
  | "step_free"
  | "lifts_ramps"
  | "toilets"
  | "seating_service"
  | "sensory"
  | "assistance"
  | "temporary";

export type FeatureConfig = {
  type: FloorPlanFeatureType;
  label: string;
  shortLabel: string;
  icon: string;
  category: FeatureCategory;
  categoryLabel: string;
  markerClass: string;
  simplifyVisible: boolean;
  detailFields: string[];
};

export const FEATURE_CATEGORIES: Record<FeatureCategory, string> = {
  entrances: "Entrances and exits",
  step_free: "Step-free movement",
  lifts_ramps: "Lifts and ramps",
  toilets: "Toilets and changing facilities",
  seating_service: "Seating and service",
  sensory: "Sensory and communication",
  assistance: "Assistance points",
  temporary: "Temporary issues",
};

export const FEATURE_CONFIG: Record<FloorPlanFeatureType, FeatureConfig> = {
  accessible_entrance: {
    type: "accessible_entrance",
    label: "Accessible entrance",
    shortLabel: "Access",
    icon: "♿",
    category: "entrances",
    categoryLabel: FEATURE_CATEGORIES.entrances,
    markerClass: "fp-marker--entrance",
    simplifyVisible: true,
    detailFields: ["doorWidthMm", "thresholdHeightMm"],
  },
  alternative_accessible_entrance: {
    type: "alternative_accessible_entrance",
    label: "Alternative accessible entrance",
    shortLabel: "Alt",
    icon: "♿",
    category: "entrances",
    categoryLabel: FEATURE_CATEGORIES.entrances,
    markerClass: "fp-marker--entrance",
    simplifyVisible: true,
    detailFields: ["doorWidthMm"],
  },
  main_entrance: {
    type: "main_entrance",
    label: "Main entrance",
    shortLabel: "Main",
    icon: "🚪",
    category: "entrances",
    categoryLabel: FEATURE_CATEGORIES.entrances,
    markerClass: "fp-marker--entrance",
    simplifyVisible: false,
    detailFields: ["doorWidthMm"],
  },
  doorway: {
    type: "doorway",
    label: "Doorway",
    shortLabel: "Door",
    icon: "🚪",
    category: "step_free",
    categoryLabel: FEATURE_CATEGORIES.step_free,
    markerClass: "fp-marker--doorway",
    simplifyVisible: false,
    detailFields: ["doorWidthMm", "thresholdHeightMm"],
  },
  corridor: {
    type: "corridor",
    label: "Corridor",
    shortLabel: "Corridor",
    icon: "↔",
    category: "step_free",
    categoryLabel: FEATURE_CATEGORIES.step_free,
    markerClass: "fp-marker--corridor",
    simplifyVisible: false,
    detailFields: ["corridorWidthMm", "distanceMetres"],
  },
  ramp: {
    type: "ramp",
    label: "Ramp",
    shortLabel: "Ramp",
    icon: "↗",
    category: "lifts_ramps",
    categoryLabel: FEATURE_CATEGORIES.lifts_ramps,
    markerClass: "fp-marker--ramp",
    simplifyVisible: true,
    detailFields: ["rampGradient"],
  },
  lift: {
    type: "lift",
    label: "Lift",
    shortLabel: "Lift",
    icon: "🛗",
    category: "lifts_ramps",
    categoryLabel: FEATURE_CATEGORIES.lifts_ramps,
    markerClass: "fp-marker--lift",
    simplifyVisible: true,
    detailFields: ["liftDoorWidthMm"],
  },
  stairs: {
    type: "stairs",
    label: "Stairs",
    shortLabel: "Stairs",
    icon: "🪜",
    category: "lifts_ramps",
    categoryLabel: FEATURE_CATEGORIES.lifts_ramps,
    markerClass: "fp-marker--stairs",
    simplifyVisible: false,
    detailFields: [],
  },
  escalator: {
    type: "escalator",
    label: "Escalator",
    shortLabel: "Esc",
    icon: "⬆",
    category: "lifts_ramps",
    categoryLabel: FEATURE_CATEGORIES.lifts_ramps,
    markerClass: "fp-marker--stairs",
    simplifyVisible: false,
    detailFields: [],
  },
  accessible_toilet: {
    type: "accessible_toilet",
    label: "Accessible toilet",
    shortLabel: "Toilet",
    icon: "🚻",
    category: "toilets",
    categoryLabel: FEATURE_CATEGORIES.toilets,
    markerClass: "fp-marker--toilet",
    simplifyVisible: true,
    detailFields: ["doorWidthMm", "turningCircleMm"],
  },
  changing_places: {
    type: "changing_places",
    label: "Changing Places facility",
    shortLabel: "CP",
    icon: "🚻",
    category: "toilets",
    categoryLabel: FEATURE_CATEGORIES.toilets,
    markerClass: "fp-marker--changing-places",
    simplifyVisible: true,
    detailFields: ["doorWidthMm", "turningCircleMm"],
  },
  ambulant_toilet: {
    type: "ambulant_toilet",
    label: "Ambulant toilet",
    shortLabel: "Amb",
    icon: "🚻",
    category: "toilets",
    categoryLabel: FEATURE_CATEGORIES.toilets,
    markerClass: "fp-marker--toilet",
    simplifyVisible: false,
    detailFields: ["doorWidthMm"],
  },
  service_counter: {
    type: "service_counter",
    label: "Service counter",
    shortLabel: "Counter",
    icon: "🧑‍💼",
    category: "seating_service",
    categoryLabel: FEATURE_CATEGORIES.seating_service,
    markerClass: "fp-marker--service",
    simplifyVisible: false,
    detailFields: ["counterHeightMm"],
  },
  accessible_seating: {
    type: "accessible_seating",
    label: "Accessible seating",
    shortLabel: "Seat",
    icon: "💺",
    category: "seating_service",
    categoryLabel: FEATURE_CATEGORIES.seating_service,
    markerClass: "fp-marker--seating",
    simplifyVisible: true,
    detailFields: [],
  },
  quiet_room: {
    type: "quiet_room",
    label: "Quiet room",
    shortLabel: "Quiet",
    icon: "🔇",
    category: "sensory",
    categoryLabel: FEATURE_CATEGORIES.sensory,
    markerClass: "fp-marker--quiet",
    simplifyVisible: true,
    detailFields: [],
  },
  low_sensory_zone: {
    type: "low_sensory_zone",
    label: "Low-sensory zone",
    shortLabel: "Low",
    icon: "🔇",
    category: "sensory",
    categoryLabel: FEATURE_CATEGORIES.sensory,
    markerClass: "fp-marker--quiet",
    simplifyVisible: true,
    detailFields: [],
  },
  hearing_loop: {
    type: "hearing_loop",
    label: "Hearing loop",
    shortLabel: "Loop",
    icon: "🔊",
    category: "sensory",
    categoryLabel: FEATURE_CATEGORIES.sensory,
    markerClass: "fp-marker--hearing",
    simplifyVisible: false,
    detailFields: [],
  },
  tactile_signage: {
    type: "tactile_signage",
    label: "Tactile signage",
    shortLabel: "Tactile",
    icon: "⠿",
    category: "sensory",
    categoryLabel: FEATURE_CATEGORIES.sensory,
    markerClass: "fp-marker--signage",
    simplifyVisible: false,
    detailFields: [],
  },
  braille_signage: {
    type: "braille_signage",
    label: "Braille signage",
    shortLabel: "Braille",
    icon: "⠿",
    category: "sensory",
    categoryLabel: FEATURE_CATEGORIES.sensory,
    markerClass: "fp-marker--signage",
    simplifyVisible: false,
    detailFields: [],
  },
  assistance_point: {
    type: "assistance_point",
    label: "Assistance point",
    shortLabel: "Help",
    icon: "🆘",
    category: "assistance",
    categoryLabel: FEATURE_CATEGORIES.assistance,
    markerClass: "fp-marker--assistance",
    simplifyVisible: true,
    detailFields: [],
  },
  reception: {
    type: "reception",
    label: "Reception",
    shortLabel: "Recep",
    icon: "ℹ",
    category: "seating_service",
    categoryLabel: FEATURE_CATEGORIES.seating_service,
    markerClass: "fp-marker--service",
    simplifyVisible: true,
    detailFields: ["counterHeightMm"],
  },
  public_exit: {
    type: "public_exit",
    label: "Public exit",
    shortLabel: "Exit",
    icon: "🚪",
    category: "entrances",
    categoryLabel: FEATURE_CATEGORIES.entrances,
    markerClass: "fp-marker--entrance",
    simplifyVisible: false,
    detailFields: [],
  },
  temporary_barrier: {
    type: "temporary_barrier",
    label: "Temporary barrier",
    shortLabel: "Barrier",
    icon: "⚠",
    category: "temporary",
    categoryLabel: FEATURE_CATEGORIES.temporary,
    markerClass: "fp-marker--temporary",
    simplifyVisible: false,
    detailFields: [],
  },
  temporary_closure: {
    type: "temporary_closure",
    label: "Temporary closure",
    shortLabel: "Closed",
    icon: "⚠",
    category: "temporary",
    categoryLabel: FEATURE_CATEGORIES.temporary,
    markerClass: "fp-marker--temporary",
    simplifyVisible: false,
    detailFields: [],
  },
  route_destination: {
    type: "route_destination",
    label: "Route destination",
    shortLabel: "Dest",
    icon: "📍",
    category: "step_free",
    categoryLabel: FEATURE_CATEGORIES.step_free,
    markerClass: "fp-marker--destination",
    simplifyVisible: true,
    detailFields: [],
  },
  other_accessibility_feature: {
    type: "other_accessibility_feature",
    label: "Accessibility feature",
    shortLabel: "Feature",
    icon: "♿",
    category: "assistance",
    categoryLabel: FEATURE_CATEGORIES.assistance,
    markerClass: "fp-marker--default",
    simplifyVisible: false,
    detailFields: [],
  },
};

export function getFeatureConfig(type: FloorPlanFeatureType): FeatureConfig {
  return FEATURE_CONFIG[type];
}

export function buildFeatureAccessibleName(
  feature: Pick<
    import("@/lib/access/floor-plan/schemas").FloorPlanFeature,
    "name" | "type" | "status" | "operationalStatus"
  >,
): string {
  const config = getFeatureConfig(feature.type);
  const statusLabel =
    feature.status === "verified"
      ? "Verified"
      : feature.status === "venue_claimed"
        ? "Venue supplied"
        : feature.status === "community_reported"
          ? "Community reported"
          : "Not yet verified";
  const opLabel =
    feature.operationalStatus === "unavailable" ||
    feature.operationalStatus === "temporarily_closed"
      ? `. ${feature.operationalStatus === "unavailable" ? "Unavailable" : "Temporarily closed"}`
      : "";
  return `${feature.name || config.label}. ${statusLabel}${opLabel}. Open details.`;
}
