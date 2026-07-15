export type SupportArea = "All" | "Care" | "Transport" | "NDIS Help" | "Jobs" | "Places";
export type ResultCategory = SupportArea | "Plan" | "Support";

export type SearchResult = {
  title: string;
  category: ResultCategory;
  description: string;
  action: string;
  href: string;
};

export type MenuItem = {
  label: string;
  href: string;
  description: string;
};

export type FooterLink = {
  label: string;
  href: string;
};

export type SponsoredPlacement = {
  id: string;
  title: string;
  category: string;
  description: string;
  cta: string;
  href: string;
  contextAreas: SupportArea[];
  placement: "primary" | "search" | "footer";
};

export type TrustMetric = {
  value: string;
  label: string;
};

export type DifferenceCard = {
  title: string;
  body: string;
  badge: string;
};

export type JourneyStep = {
  number: string;
  title: string;
  body: string;
};

export type MarketplaceCard = {
  title: string;
  eyebrow: string;
  body: string;
  icon: string;
  href: string;
};

export const supportAreas: SupportArea[] = [
  "All",
  "Care",
  "Transport",
  "NDIS Help",
  "Jobs",
  "Places",
];

export const logoMenuItems: MenuItem[] = [
  {
    label: "Find support",
    href: "/provider-finder",
    description: "Care, transport, jobs, places and guidance in one search.",
  },
  {
    label: "Care",
    href: "/care",
    description: "Consent-aware support coordination for participants and providers.",
  },
  {
    label: "Transport",
    href: "/transport",
    description: "Accessible trip requests with safety and eligibility checks.",
  },
  {
    label: "Employment",
    href: "/employment",
    description: "Inclusive work pathways and workplace adjustment support.",
  },
  {
    label: "Accessible places",
    href: "/accessibility-map",
    description: "Explore venues with access notes, quiet spaces and community guidance.",
  },
  {
    label: "List your service",
    href: "/for-providers",
    description: "Join MapAble as a support worker, provider or transport partner.",
  },
  {
    label: "Help Centre",
    href: "/help",
    description: "Support for pilot interest, privacy and access requests.",
  },
];

export const homepageHeroCopy = {
  headline: "Find accessible places, supports, and journeys you can actually use.",
  subheading:
    "MapAble connects verified accessibility information, NDIS-aware providers, accessible transport, employment pathways, and support coordination into one practical platform.",
  primaryCta: "Find accessible places",
  secondaryCta: "Request support",
};

export const homepageHeroCtas = [
  { label: "Find accessible places", href: "/accessibility-map" },
  { label: "Request support", href: "/care/request" },
  { label: "Plan accessible transport", href: "/journey-planner" },
  { label: "Verify my venue", href: "/verify-my-venue" },
] as const;

export const homepageCategoryChips = [
  { label: "Care", href: "/provider-finder?area=Care" },
  { label: "Transport", href: "/provider-finder?area=Transport" },
  { label: "NDIS Guidance", href: "/ask" },
  { label: "Jobs", href: "/provider-finder?area=Jobs" },
  { label: "Access", href: "/accessibility-map" },
];

export const homepageTrustStripItems = [
  "Verified support options",
  "Accessible-first design",
  "NDIS-aware workflows",
  "Built with lived experience",
];

export const homepageProofMetrics: TrustMetric[] = [
  { value: "Pilot target", label: "Places mapped" },
  { value: "Coming soon", label: "Access details verified" },
  { value: "Demo", label: "Providers accepting enquiries" },
  { value: "Coming soon", label: "Transport-ready journeys" },
];

export const competitorContrastCards: DifferenceCard[] = [
  {
    title: "More than a directory",
    body: "Find providers alongside availability signals, access-readiness, and practical next steps.",
    badge: "Beyond listings",
  },
  {
    title: "More detailed than traffic-light ratings",
    body: "See measurements, confidence, last checked dates, and evidence sources — not only a colour.",
    badge: "Evidence-based",
  },
  {
    title: "More practical than static place reviews",
    body: "Plan routes, book transport or support, and update access info when things change.",
    badge: "Journey-ready",
  },
  {
    title: "Built for care + transport + support coordination",
    body: "MapAble connects access information with providers, journeys, and coordination workflows.",
    badge: "Connected support",
  },
];

export const homepageMapPreviewFilters = [
  "Step-free entry",
  "Accessible toilet",
  "Accessible parking",
  "Quiet/sensory-friendly",
  "Assistance animal welcome",
  "Public transport nearby",
  "MapAble verified",
  "Transport bookable",
] as const;

export const homepageSupportJourneySteps: JourneyStep[] = [
  {
    number: "01",
    title: "Search place",
    body: "Find venues and services with access notes that matter to you.",
  },
  {
    number: "02",
    title: "Check access",
    body: "Review measurements, confidence, and what still needs confirming.",
  },
  {
    number: "03",
    title: "Plan route",
    body: "See transport assumptions, buffers, and meeting options.",
  },
  {
    number: "04",
    title: "Book transport/support",
    body: "Request accessible transport or a support worker when you need one.",
  },
  {
    number: "05",
    title: "Confirm visit",
    body: "Share access notes with your coordinator, driver, or carer.",
  },
  {
    number: "06",
    title: "Update access info",
    body: "Report changes so the next person has better information.",
  },
];

export const homepageProviderPitch = {
  headline: "Grow by being useful, trusted, and accessible.",
  body: "Providers on MapAble can show live availability, verified access-readiness, NDIS-aware enquiry flows, response-time badges, and venue or clinic access profiles — so participants can choose with clearer evidence.",
  points: [
    "Live availability",
    "Verified access-readiness",
    "NDIS-aware enquiry flow",
    "Response-time badge",
    "Venue/provider access profile",
  ],
  ctaLabel: "Explore provider tools",
  ctaHref: "/provider-growth",
};

export const homepageFinalCta = {
  headline: "Help build Australia’s access layer.",
  body: "Map places, verify venues, join a mapping day, or share Access-Fit needs on your terms.",
  ctas: [
    { label: "Join a mapping day", href: "/mapping-days" },
    { label: "Add access info", href: "/add-access-info" },
    { label: "Verify my venue", href: "/verify-my-venue" },
    { label: "Compare MapAble", href: "/compare" },
  ],
};

export const guidedSearchPanelCopy = {
  eyebrow: "Guided support search",
  heading: "Build your support pathway",
  intro:
    "Describe what you need in plain language. MapAble will help you compare care, transport, funding and practical next steps in one guided conversation.",
  inputLabel: "What support do you need?",
  placeholder: "Example: I need transport to therapy",
  submitLabel: "Search",
  ctaLabel: "Start guided search",
  previewHint:
    "Your guided conversation will appear here once you start searching. Use the prompts above or type your own need.",
};

export const guidedSearchPromptChips = [
  {
    label: "Find a support worker",
    prefill: "Find a support worker who understands wheelchair access",
  },
  {
    label: "Book accessible transport",
    prefill: "Accessible transport to an appointment tomorrow",
  },
  {
    label: "Understand NDIS options",
    prefill: "Help me understand NDIS transport funding",
  },
  {
    label: "Find inclusive jobs",
    prefill: "Remote jobs with flexible hours",
  },
];

export const pathwayPreviewSteps = [
  "Support worker shortlist",
  "Accessible transport buffer",
  "NDIS notes prepared",
];

export type PersonaEntry = {
  title: string;
  description: string;
  href: string;
  cta: string;
};

export const personaEntries: PersonaEntry[] = [
  {
    title: "I'm looking for support",
    description: "Compare care, transport and practical help in one guided search.",
    href: "/provider-finder",
    cta: "Find support",
  },
  {
    title: "I'm a carer or family member",
    description: "Explore support workers and providers with clear access notes.",
    href: "/provider-finder?area=Care",
    cta: "Explore care options",
  },
  {
    title: "I'm a support coordinator",
    description: "Coordinate participant pathways with NDIS-aware guidance.",
    href: "/support-coordinator",
    cta: "Open coordinator tools",
  },
  {
    title: "I'm a provider",
    description: "List your service and connect with participants who need your support.",
    href: "/for-providers",
    cta: "List your service",
  },
  {
    title: "I'm an employer",
    description: "Build inclusive hiring pathways and workplace adjustment support.",
    href: "/employment",
    cta: "Explore employment",
  },
];

export const quickPrompts = [
  "I need help getting to physio next Tuesday morning",
  "Find a support worker who understands wheelchair access",
  "Accessible transport to an appointment tomorrow",
  "Help me understand NDIS transport funding",
  "Remote jobs with flexible hours",
  "Quiet accessible cafes near me",
];

export const sampleResults: SearchResult[] = [
  {
    title: "Create a care + transport plan",
    category: "Plan",
    description:
      "Combine appointment support, accessible pickup, buffer time and return travel into one guided next step.",
    action: "Start guided plan",
    href: "/provider-finder?area=Care",
  },
  {
    title: "Find trusted support workers",
    category: "Care",
    description:
      "Compare support workers and providers by skills, availability, communication style and access experience.",
    action: "Compare support",
    href: "/provider-finder?area=Care",
  },
  {
    title: "Accessible transport options",
    category: "Transport",
    description:
      "Find wheelchair accessible transport, community transport and providers that understand access needs.",
    action: "Search rides",
    href: "/provider-finder?area=Transport",
  },
  {
    title: "NDIS transport funding guide",
    category: "NDIS Help",
    description:
      "Plain-language guidance on using transport funding, service agreements, invoices and plan-manager notes.",
    action: "Read guide",
    href: "/ask?q=NDIS+transport+funding",
  },
  {
    title: "Inclusive jobs and work support",
    category: "Jobs",
    description:
      "Explore remote roles, flexible work and interview supports that match your strengths and access needs.",
    action: "Explore jobs",
    href: "/provider-finder?area=Jobs",
  },
  {
    title: "Accessible places nearby",
    category: "Places",
    description:
      "Discover cafes, venues and everyday places with access notes, quiet spaces and wheelchair-friendly details.",
    action: "Open places",
    href: "/accessibility-map",
  },
];

export const trustMetrics: TrustMetric[] = homepageProofMetrics;

export const differenceCards: DifferenceCard[] = competitorContrastCards;

export const journeySteps: JourneyStep[] = homepageSupportJourneySteps;

export const marketplaceCards: MarketplaceCard[] = [
  {
    title: "Care",
    eyebrow: "Find support workers",
    body: "Compare experience, preferences, service type and availability in one friendly flow.",
    icon: "🤝",
    href: "/provider-finder?area=Care",
  },
  {
    title: "Transport",
    eyebrow: "Accessible rides",
    body: "Coordinate pickup notes, wheelchair access, timing buffers and appointment travel.",
    icon: "🚐",
    href: "/provider-finder?area=Transport",
  },
  {
    title: "NDIS Help",
    eyebrow: "Plain-language guidance",
    body: "Understand funding, provider choices, invoices and next steps without jargon fog.",
    icon: "🧭",
    href: "/ask",
  },
  {
    title: "Jobs",
    eyebrow: "Inclusive opportunity",
    body: "Find flexible work, interview support, transport links and workplace adjustment guidance.",
    icon: "💼",
    href: "/provider-finder?area=Jobs",
  },
  {
    title: "Places",
    eyebrow: "Access notes",
    body: "Discover everyday venues with wheelchair-friendly details, quiet spaces and community notes.",
    icon: "📍",
    href: "/accessibility-map",
  },
];

export const footerPlatformLinks: FooterLink[] = [
  { label: "Care", href: "/care" },
  { label: "Transport", href: "/transport" },
  { label: "Employment", href: "/employment" },
  { label: "Providers", href: "/providers" },
  { label: "Accessible places", href: "/accessibility-map" },
  { label: "Provider finder", href: "/provider-finder" },
];

export const footerResourceLinks: FooterLink[] = [
  { label: "Resources", href: "/resources" },
  { label: "Help Centre", href: "/help" },
  { label: "Register provider interest", href: "/for-providers" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Accessibility", href: "/accessibility-statement" },
];

export const companyRegistrationDetails = {
  abn: "55 641 613 541",
  ndisRegistrationNumber: "To be confirmed",
};

export const MAPABLE_CARE_COMBINED_PHONE = "0434 083 624";

export const sponsoredPlacements: SponsoredPlacement[] = [
  {
    id: "support-coordination-partner",
    title: "Need help comparing support options?",
    category: "Sponsored partner",
    description:
      "Connect with a MapAble-aligned support coordination partner who can help you understand services, funding and next steps.",
    cta: "View partner",
    href: "/ask?q=support+coordination",
    contextAreas: ["All", "Care", "NDIS Help"],
    placement: "primary",
  },
  {
    id: "accessible-transport-partner",
    title: "Accessible appointment transport",
    category: "Sponsored result",
    description:
      "A featured transport partner for wheelchair-accessible rides, appointment pickups and driver assistance.",
    cta: "Check availability",
    href: "/provider-finder?area=Transport",
    contextAreas: ["All", "Transport"],
    placement: "search",
  },
  {
    id: "assistive-tech-partner",
    title: "Assistive technology partner",
    category: "Community partner",
    description:
      "Explore mobility, communication and daily-living products from accessibility-focused providers.",
    cta: "Explore partner",
    href: "/provider-finder",
    contextAreas: ["All", "Care", "Places"],
    placement: "footer",
  },
];

export const mapAbleCareCombinedDesignTests = [
  {
    name: "search field starts blank",
    expectedInitialQuery: "",
  },
  {
    name: "positioning uses combined care language",
    expectedHeadline:
      "Find accessible places, supports, and journeys you can actually use.",
  },
  {
    name: "support selector uses user-facing areas instead of agents",
    expectedAreas: supportAreas,
  },
  {
    name: "footer displays current phone number",
    expectedPhone: MAPABLE_CARE_COMBINED_PHONE,
  },
  {
    name: "footer displays company ABN and NDIS registration number",
    expectedRegistrationDetails: companyRegistrationDetails,
  },
  {
    name: "typography uses static wavy display treatment without animation",
    expectedTypography: "mapable-display + static WavyText",
  },
  {
    name: "wavy typography keeps clear spacing between words",
    expectedWordSpacing: "0.34em",
  },
  {
    name: "design includes clearly labelled sponsored partner placements",
    expectedSponsoredPlacements: sponsoredPlacements.map((placement) => placement.placement),
  },
  {
    name: "hero section is extracted to dedicated component",
    expectedDeclaration: "HeroSection",
  },
  {
    name: "guided landing includes primary homepage sections",
    expectedSections: [
      "HeroSection",
      "HomepageProofStrip",
      "CompetitorContrastStrip",
      "HomepageMapPreview",
      "HomepageSupportJourney",
      "HomepageProviderPitch",
      "HomepageFinalCta",
      "GuidedSearchPanel",
      "BoundaryNotice",
    ],
  },
  {
    name: "homepage has single guided search panel anchor",
    expectedGuidedSearchAnchor: "guided-search-panel",
  },
];

export function getPredictiveSuggestions(query: string) {
  if (!query.trim()) return quickPrompts.slice(0, 4);
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(" ").filter(Boolean);
  return quickPrompts
    .filter((prompt) => {
      const lowerPrompt = prompt.toLowerCase();
      return (
        lowerPrompt.includes(lowerQuery) ||
        queryWords.some((word) => word.length > 3 && lowerPrompt.includes(word))
      );
    })
    .slice(0, 4);
}

export function getFilteredResults(query: string, area: SupportArea) {
  const lowerQuery = query.toLowerCase();
  return sampleResults
    .filter((result) => {
      const matchesArea = area === "All" || result.category === area || result.category === "Plan";
      const searchableText = `${result.title} ${result.category} ${result.description}`.toLowerCase();
      const matchesQuery =
        !lowerQuery ||
        lowerQuery.split(" ").some((word) => word.length > 3 && searchableText.includes(word));
      return matchesArea && matchesQuery;
    })
    .slice(0, 4);
}

export function getSponsoredPlacement(area: SupportArea, placement: SponsoredPlacement["placement"]) {
  return sponsoredPlacements.find(
    (item) =>
      item.placement === placement &&
      (item.contextAreas.includes(area) || item.contextAreas.includes("All")),
  );
}
