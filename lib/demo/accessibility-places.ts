import type { PlaceAccessProfile } from "@/lib/access-fit/types";

export type DemoAccessTier = "Bronze" | "Silver" | "Gold" | "Unverified";

export type DemoAccessPlace = {
  id: string;
  slug: string;
  name: string;
  category: string;
  suburb: string;
  state: string;
  /** Venue latitude (WGS84). Optional — places without coordinates appear in list view only. */
  latitude?: number | null;
  /** Venue longitude (WGS84). Optional — places without coordinates appear in list view only. */
  longitude?: number | null;
  accessScore: number;
  tier: DemoAccessTier;
  confidence: "high" | "medium" | "low" | "unknown";
  lastChecked: string;
  source: "community" | "provider" | "MapAble assessor" | "partner";
  topAccessFacts: string[];
  keyBarrier: string | null;
  isDemo: true;
  profile: PlaceAccessProfile;
  measurements: { label: string; value: string; note?: string }[];
  sensoryNotes: string[];
  domains: { name: string; summary: string; status: "known" | "unknown" | "barrier" }[];
};

export const DEMO_ACCESS_PLACES: DemoAccessPlace[] = [
  {
    id: "demo-parramatta-library",
    slug: "parramatta-city-library",
    name: "Parramatta City Library",
    category: "library",
    suburb: "Parramatta",
    state: "NSW",
    latitude: -33.8155,
    longitude: 151.0031,
    accessScore: 82,
    tier: "Silver",
    confidence: "high",
    lastChecked: "2026-05-12",
    source: "MapAble assessor",
    topAccessFacts: [
      "Step-free main entrance",
      "Accessible toilet on ground floor",
      "Hearing loop at service desk",
    ],
    keyBarrier: null,
    isDemo: true,
    profile: {
      stepFreeEntry: true,
      doorWidthMm: 920,
      internalStepFree: true,
      accessibleToilet: true,
      accessibleParking: true,
      dropOffPoint: true,
      lowSensoryOption: true,
      hearingLoop: true,
      staffTraining: true,
      assistanceAnimalWelcome: true,
      publicTransportNearby: true,
      transportBookable: true,
      lastVerified: "2026-05-12",
      confidence: "high",
    },
    measurements: [
      { label: "Entrance door clear width", value: "920 mm" },
      { label: "Path to entrance gradient", value: "1:20 (estimate)" },
      { label: "Accessible toilet door", value: "910 mm" },
    ],
    sensoryNotes: ["Quiet study rooms available", "Busy peak after school hours"],
    domains: [
      { name: "External path of travel", summary: "Ramped path from street and car park.", status: "known" },
      { name: "Parking / drop-off", summary: "Accessible bays and near-entrance drop-off.", status: "known" },
      { name: "Entry and exit", summary: "Automatic doors, step-free.", status: "known" },
      { name: "Internal movement", summary: "Lift and wide aisles on public floors.", status: "known" },
      { name: "Toilets and amenities", summary: "Ground-floor accessible toilet.", status: "known" },
      { name: "Information and sensory access", summary: "Hearing loop; quieter rooms.", status: "known" },
      { name: "Staff and services", summary: "Staff can assist with orientation.", status: "known" },
      { name: "Online information", summary: "Access page on venue website.", status: "known" },
    ],
  },
  {
    id: "demo-newtown-cafe",
    slug: "king-street-step-free-cafe",
    name: "King Street Step-Free Cafe",
    category: "cafe_restaurant",
    suburb: "Newtown",
    state: "NSW",
    latitude: -33.898,
    longitude: 151.179,
    accessScore: 64,
    tier: "Bronze",
    confidence: "medium",
    lastChecked: "2026-03-02",
    source: "community",
    topAccessFacts: ["Step-free entry via side door", "Assistance animal welcome"],
    keyBarrier: "Accessible toilet not confirmed",
    isDemo: true,
    profile: {
      stepFreeEntry: true,
      doorWidthMm: 860,
      internalStepFree: true,
      accessibleToilet: null,
      accessibleParking: false,
      dropOffPoint: true,
      lowSensoryOption: null,
      hearingLoop: false,
      staffTraining: null,
      assistanceAnimalWelcome: true,
      publicTransportNearby: true,
      transportBookable: true,
      lastVerified: "2026-03-02",
      confidence: "medium",
    },
    measurements: [
      { label: "Side entrance door", value: "860 mm", note: "Community estimate" },
      { label: "Entrance step height (front)", value: "140 mm", note: "Use side door instead" },
    ],
    sensoryNotes: ["Can be noisy on weekends"],
    domains: [
      { name: "External path of travel", summary: "Footpath uneven near front door.", status: "known" },
      { name: "Parking / drop-off", summary: "Street drop-off only; no accessible bay.", status: "barrier" },
      { name: "Entry and exit", summary: "Side door is step-free.", status: "known" },
      { name: "Internal movement", summary: "Narrow tables; staff can rearrange.", status: "known" },
      { name: "Toilets and amenities", summary: "Toilet access unconfirmed.", status: "unknown" },
      { name: "Information and sensory access", summary: "No hearing loop reported.", status: "barrier" },
      { name: "Staff and services", summary: "Staff training unknown.", status: "unknown" },
      { name: "Online information", summary: "Limited access notes online.", status: "unknown" },
    ],
  },
  {
    id: "demo-newcastle-toilet",
    slug: "newcastle-harbour-accessible-toilet",
    name: "Newcastle Harbour Accessible Toilet",
    category: "public_toilet",
    suburb: "Newcastle",
    state: "NSW",
    latitude: -32.928,
    longitude: 151.782,
    accessScore: 71,
    tier: "Silver",
    confidence: "high",
    lastChecked: "2026-04-18",
    source: "partner",
    topAccessFacts: ["RADAR key not required", "Step-free path from wharf"],
    keyBarrier: null,
    isDemo: true,
    profile: {
      stepFreeEntry: true,
      doorWidthMm: 900,
      internalStepFree: true,
      accessibleToilet: true,
      accessibleParking: true,
      dropOffPoint: true,
      lowSensoryOption: null,
      hearingLoop: null,
      staffTraining: null,
      assistanceAnimalWelcome: true,
      publicTransportNearby: true,
      transportBookable: false,
      lastVerified: "2026-04-18",
      confidence: "high",
    },
    measurements: [
      { label: "Door width", value: "900 mm" },
      { label: "Transfer space", value: "Reported as adequate" },
    ],
    sensoryNotes: [],
    domains: [
      { name: "External path of travel", summary: "Firm path from promenade.", status: "known" },
      { name: "Parking / drop-off", summary: "Accessible parking within 50 m.", status: "known" },
      { name: "Entry and exit", summary: "Step-free.", status: "known" },
      { name: "Internal movement", summary: "Single-room facility.", status: "known" },
      { name: "Toilets and amenities", summary: "Accessible toilet verified.", status: "known" },
      { name: "Information and sensory access", summary: "Signage present.", status: "known" },
      { name: "Staff and services", summary: "Unstaffed.", status: "unknown" },
      { name: "Online information", summary: "Council listing available.", status: "known" },
    ],
  },
  {
    id: "demo-melbourne-gallery",
    slug: "southbank-sensory-friendly-gallery",
    name: "Southbank Sensory-Friendly Gallery",
    category: "other",
    suburb: "Southbank",
    state: "VIC",
    latitude: -37.822,
    longitude: 144.9685,
    accessScore: 88,
    tier: "Gold",
    confidence: "high",
    lastChecked: "2026-06-01",
    source: "provider",
    topAccessFacts: [
      "Quiet hours each Tuesday",
      "Step-free entry",
      "Staff trained in sensory support",
    ],
    keyBarrier: null,
    isDemo: true,
    profile: {
      stepFreeEntry: true,
      doorWidthMm: 1000,
      internalStepFree: true,
      accessibleToilet: true,
      accessibleParking: true,
      dropOffPoint: true,
      lowSensoryOption: true,
      hearingLoop: true,
      staffTraining: true,
      assistanceAnimalWelcome: true,
      publicTransportNearby: true,
      transportBookable: true,
      lastVerified: "2026-06-01",
      confidence: "high",
    },
    measurements: [
      { label: "Entrance door", value: "1000 mm" },
      { label: "Gallery aisles", value: "1200 mm typical" },
    ],
    sensoryNotes: ["Dim galleries optional", "Quiet hours 09:00–11:00 Tuesdays"],
    domains: [
      { name: "External path of travel", summary: "Level path from tram stop.", status: "known" },
      { name: "Parking / drop-off", summary: "Accessible parking under building.", status: "known" },
      { name: "Entry and exit", summary: "Automatic doors.", status: "known" },
      { name: "Internal movement", summary: "Lifts to all floors.", status: "known" },
      { name: "Toilets and amenities", summary: "Accessible toilets each floor.", status: "known" },
      { name: "Information and sensory access", summary: "Quiet hours and hearing loop.", status: "known" },
      { name: "Staff and services", summary: "Sensory support training.", status: "known" },
      { name: "Online information", summary: "Detailed access guide published.", status: "known" },
    ],
  },
  {
    id: "demo-brisbane-community-centre",
    slug: "south-brisbane-community-centre",
    name: "South Brisbane Community Centre",
    category: "other",
    suburb: "South Brisbane",
    state: "QLD",
    accessScore: 55,
    tier: "Bronze",
    confidence: "low",
    lastChecked: "2026-01-10",
    source: "community",
    topAccessFacts: ["Ramp at side entrance reported", "Assistance animal welcome"],
    keyBarrier: "Coordinates not yet mapped",
    isDemo: true,
    profile: {
      stepFreeEntry: true,
      doorWidthMm: null,
      internalStepFree: null,
      accessibleToilet: null,
      accessibleParking: false,
      dropOffPoint: true,
      lowSensoryOption: null,
      hearingLoop: null,
      staffTraining: null,
      assistanceAnimalWelcome: true,
      publicTransportNearby: true,
      transportBookable: false,
      lastVerified: "2026-01-10",
      confidence: "low",
    },
    measurements: [],
    sensoryNotes: [],
    domains: [
      { name: "External path of travel", summary: "Community report only.", status: "unknown" },
      { name: "Parking / drop-off", summary: "Street parking only.", status: "unknown" },
      { name: "Entry and exit", summary: "Side ramp reported.", status: "known" },
      { name: "Internal movement", summary: "Not yet assessed.", status: "unknown" },
      { name: "Toilets and amenities", summary: "Not yet assessed.", status: "unknown" },
      { name: "Information and sensory access", summary: "Not yet assessed.", status: "unknown" },
      { name: "Staff and services", summary: "Not yet assessed.", status: "unknown" },
      { name: "Online information", summary: "No access page found.", status: "unknown" },
    ],
  },
];

export const ACCESS_MAP_FILTERS = [
  { id: "step-free", label: "Step-free entry" },
  { id: "toilet", label: "Accessible toilet" },
  { id: "parking", label: "Accessible parking" },
  { id: "drop-off", label: "Drop-off point" },
  { id: "quiet", label: "Quiet / sensory-friendly" },
  { id: "hearing-loop", label: "Hearing loop" },
  { id: "assistance-animal", label: "Assistance animal welcome" },
  { id: "staff-trained", label: "Staff trained" },
  { id: "pt-nearby", label: "Public transport nearby" },
  { id: "transport-bookable", label: "Transport bookable" },
  { id: "support-nearby", label: "Support worker nearby" },
  { id: "verified", label: "MapAble verified" },
] as const;

export function getDemoPlaceBySlug(slug: string): DemoAccessPlace | undefined {
  return DEMO_ACCESS_PLACES.find((place) => place.slug === slug);
}

export function filterDemoPlaces(
  places: DemoAccessPlace[],
  options: {
    query?: string;
    suburb?: string;
    filters?: string[];
  },
): DemoAccessPlace[] {
  const q = options.query?.trim().toLowerCase() ?? "";
  const suburb = options.suburb?.trim().toLowerCase() ?? "";
  const filters = options.filters ?? [];

  return places.filter((place) => {
    const haystack = `${place.name} ${place.category} ${place.suburb} ${place.topAccessFacts.join(" ")}`.toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (suburb && !place.suburb.toLowerCase().includes(suburb)) return false;
    for (const filter of filters) {
      if (filter === "step-free" && place.profile.stepFreeEntry !== true) return false;
      if (filter === "toilet" && place.profile.accessibleToilet !== true) return false;
      if (filter === "parking" && place.profile.accessibleParking !== true) return false;
      if (filter === "drop-off" && place.profile.dropOffPoint !== true) return false;
      if (filter === "quiet" && place.profile.lowSensoryOption !== true) return false;
      if (filter === "hearing-loop" && place.profile.hearingLoop !== true) return false;
      if (filter === "assistance-animal" && place.profile.assistanceAnimalWelcome !== true)
        return false;
      if (filter === "staff-trained" && place.profile.staffTraining !== true) return false;
      if (filter === "pt-nearby" && place.profile.publicTransportNearby !== true) return false;
      if (filter === "transport-bookable" && place.profile.transportBookable !== true) return false;
      if (filter === "verified" && place.tier === "Unverified") return false;
      if (filter === "support-nearby") {
        // Demo filter: mark as available when transport bookable (proxy)
        if (place.profile.transportBookable !== true) return false;
      }
    }
    return true;
  });
}
