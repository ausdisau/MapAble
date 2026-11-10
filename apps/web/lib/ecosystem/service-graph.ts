/**
 * Read-only service discovery for MapAble One.
 *
 * Source of truth: canonical MapAble routes on main (10 November 2026).
 * PR #32 (MapAble Day) and PR #35 (Access & Inclusion) remain draft.
 * Nothing in this graph grants identity, consent, screening, booking,
 * payment, seller-verification or data-sharing authority.
 */
export type MapAbleServiceId =
  | "challenges"
  | "access"
  | "day"
  | "care"
  | "transport"
  | "employment"
  | "marketplace"
  | "cripsquare"
  | "providers";

export type MapAbleServiceState =
  | "information-route"
  | "draft-preview"
  | "proposed-integration";

export type MapAbleService = {
  id: MapAbleServiceId;
  name: string;
  description: string;
  state: MapAbleServiceState;
  /** Only navigable, source-inspected public information routes have hrefs. */
  href: string | null;
  action: string | null;
  evidenceNote: string;
};

export type MapAbleJourneyId =
  | "plan-a-day"
  | "get-to-work"
  | "solve-an-access-barrier"
  | "find-equipment"
  | "organise-support";

export type MapAbleJourney = {
  id: MapAbleJourneyId;
  name: string;
  description: string;
  serviceIds: readonly MapAbleServiceId[];
  /** Suggested sequence, never a booking, task creation or data transfer. */
  handoffNote: string;
};

export const MAPABLE_SERVICES: readonly MapAbleService[] = [
  {
    id: "challenges",
    name: "MapAble Challenges",
    description: "Help identify and document accessibility barriers through community mapping.",
    state: "information-route",
    href: "/mapping-days",
    action: "Explore Mapping Days",
    evidenceNote: "Mapping Days page exists. Example events are demos; full challenge submission and PR #35 remain gated.",
  },
  {
    id: "access",
    name: "MapAble Access",
    description: "Explore places and access information to inform your own decisions.",
    state: "information-route",
    href: "/accessibility-map",
    action: "Explore the access map",
    evidenceNote: "An existing source route; individual observations and access claims need their own provenance checks.",
  },
  {
    id: "day",
    name: "MapAble Day",
    description: "Plan activities, support and travel together, including what to do if arrangements change.",
    state: "draft-preview",
    href: null,
    action: null,
    evidenceNote: "PR #32 is a draft. Its /dashboard/day prototype is gated and does not book or alter services.",
  },
  {
    id: "care",
    name: "MapAble Care",
    description: "Learn about participant-led disability support, provider matching and care coordination.",
    state: "information-route",
    href: "/care",
    action: "Explore Care",
    evidenceNote: "Public information route exists. No worker assignment or booking is performed from this hub.",
  },
  {
    id: "transport",
    name: "MapAble Transport",
    description: "Explore accessible travel options and how transport could support your plans.",
    state: "information-route",
    href: "/transport",
    action: "Explore Transport",
    evidenceNote: "Public information route exists. Transport and vehicle suitability are not verified by this hub.",
  },
  {
    id: "employment",
    name: "MapAble Employment",
    description: "Explore inclusive work opportunities, adjustment choices and work-related supports.",
    state: "information-route",
    href: "/employment",
    action: "Explore Employment",
    evidenceNote: "Public information route exists. No job placement or disclosure of disability information occurs.",
  },
  {
    id: "marketplace",
    name: "MapAble Marketplace + AccessiMart",
    description: "Explore assistive-technology commerce, quotes, reuse, rental and supplier evidence.",
    state: "information-route",
    href: "/marketplace",
    action: "Explore Marketplace",
    evidenceNote: "Public programme page exists; real product transactions and AccessiMart integration remain gated.",
  },
  {
    id: "cripsquare",
    name: "CripSquare community",
    description: "Future community groups, peer discussion and local connections around access and participation.",
    state: "proposed-integration",
    href: null,
    action: null,
    evidenceNote: "CripSquare is a separate repository; there is no approved identity, post or messaging federation.",
  },
  {
    id: "providers",
    name: "Australian Support Provider Finder",
    description: "Search provider records and examine source-specific registration and access information.",
    state: "information-route",
    href: "/provider-finder",
    action: "Explore Provider Finder",
    evidenceNote: "Public route exists. Demo listings and official provider records must not be conflated with worker clearance.",
  },
];

export const MAPABLE_JOURNEYS: readonly MapAbleJourney[] = [
  {
    id: "plan-a-day",
    name: "Plan my day",
    description: "See how access, support and travel could fit around the activities you choose.",
    serviceIds: ["day", "access", "care", "transport", "marketplace"],
    handoffNote: "Plans are suggestions only. No calendar, support or transport data is exchanged.",
  },
  {
    id: "get-to-work",
    name: "Get to work",
    description: "Identify an access barrier, plan a journey and discover support for employment.",
    serviceIds: ["challenges", "access", "day", "transport", "care", "employment"],
    handoffNote: "A job seeker chooses what, if anything, to disclose to an employer or service provider.",
  },
  {
    id: "solve-an-access-barrier",
    name: "Report an access barrier",
    description: "Explore community mapping, accessible places and options for participating despite a barrier.",
    serviceIds: ["challenges", "access", "cripsquare", "transport", "day"],
    handoffNote: "A community observation is not proof of venue compliance or a guarantee of access.",
  },
  {
    id: "find-equipment",
    name: "Find equipment or everyday essentials",
    description: "Compare products, ask community questions and investigate support when appropriate.",
    serviceIds: ["marketplace", "cripsquare", "providers", "care", "day"],
    handoffNote: "Listings do not guarantee product safety, clinical suitability or NDIS funding.",
  },
  {
    id: "organise-support",
    name: "Organise support",
    description: "Discover provider information, consider daily routines and coordinate travel needs.",
    serviceIds: ["providers", "care", "day", "transport", "employment"],
    handoffNote: "Provider registration, worker screening, competence, availability and suitability are separate facts.",
  },
];

export function getMapAbleService(id: MapAbleServiceId): MapAbleService {
  const service = MAPABLE_SERVICES.find((item) => item.id === id);
  if (!service) throw new Error(`Unknown MapAble service: ${id}`);
  return service;
}

export function getJourneyServices(id: MapAbleJourneyId): readonly MapAbleService[] {
  const journey = MAPABLE_JOURNEYS.find((item) => item.id === id);
  if (!journey) return [];
  return journey.serviceIds.map(getMapAbleService);
}
