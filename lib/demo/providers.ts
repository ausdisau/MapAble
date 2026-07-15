export type DemoProvider = {
  id: string;
  slug: string;
  name: string;
  services: string[];
  suburbsServed: string[];
  acceptingNewParticipants: boolean;
  waitlistStatus: "none" | "short" | "long";
  earliestAvailability: string;
  fundingTypes: string[];
  ndisRegistered: boolean;
  accessReadinessScore: number;
  transportFeasibility: "high" | "medium" | "low" | "unknown";
  responseTime: string;
  evidenceStatus: "verified" | "declared" | "expired" | "unknown";
  lastUpdated: string;
  telehealth: boolean;
  homeVisit: boolean;
  accessibleClinic: boolean;
  accessibleTransportSupported: boolean;
  isDemo: true;
  summary: string;
};

export const DEMO_PROVIDERS: DemoProvider[] = [
  {
    id: "demo-coastal-support",
    slug: "coastal-community-support",
    name: "Coastal Community Support",
    services: ["Personal care", "Community participation", "Support coordination"],
    suburbsServed: ["Newcastle", "Merewether", "Kotara"],
    acceptingNewParticipants: true,
    waitlistStatus: "none",
    earliestAvailability: "This week",
    fundingTypes: ["Agency-managed", "Plan-managed", "Self-managed"],
    ndisRegistered: true,
    accessReadinessScore: 86,
    transportFeasibility: "high",
    responseTime: "Usually within 1 business day",
    evidenceStatus: "verified",
    lastUpdated: "2026-06-20",
    telehealth: true,
    homeVisit: true,
    accessibleClinic: true,
    accessibleTransportSupported: true,
    isDemo: true,
    summary:
      "NDIS-aware community support with an accessible clinic entrance and transport-aware scheduling.",
  },
  {
    id: "demo-harbour-therapy",
    slug: "harbour-allied-therapy",
    name: "Harbour Allied Therapy",
    services: ["Occupational therapy", "Speech pathology"],
    suburbsServed: ["Parramatta", "Harris Park", "Westmead"],
    acceptingNewParticipants: true,
    waitlistStatus: "short",
    earliestAvailability: "Next fortnight",
    fundingTypes: ["Plan-managed", "Self-managed"],
    ndisRegistered: true,
    accessReadinessScore: 74,
    transportFeasibility: "medium",
    responseTime: "Usually within 2 business days",
    evidenceStatus: "declared",
    lastUpdated: "2026-05-28",
    telehealth: true,
    homeVisit: false,
    accessibleClinic: true,
    accessibleTransportSupported: false,
    isDemo: true,
    summary:
      "Therapy clinic with step-free reception and telehealth options. Transport support not bookable via MapAble yet.",
  },
  {
    id: "demo-green-rides",
    slug: "green-accessible-rides",
    name: "Green Accessible Rides",
    services: ["Accessible transport", "Appointment travel"],
    suburbsServed: ["Sydney CBD", "Inner West", "Eastern Suburbs"],
    acceptingNewParticipants: true,
    waitlistStatus: "none",
    earliestAvailability: "Tomorrow",
    fundingTypes: ["Plan-managed", "Self-managed", "Private"],
    ndisRegistered: false,
    accessReadinessScore: 91,
    transportFeasibility: "high",
    responseTime: "Usually within 4 hours",
    evidenceStatus: "verified",
    lastUpdated: "2026-06-25",
    telehealth: false,
    homeVisit: false,
    accessibleClinic: false,
    accessibleTransportSupported: true,
    isDemo: true,
    summary:
      "Wheelchair-accessible transport with published vehicle specs and driver assistance notes.",
  },
  {
    id: "demo-inclusive-work",
    slug: "inclusive-work-pathways",
    name: "Inclusive Work Pathways",
    services: ["Employment support", "Workplace adjustments"],
    suburbsServed: ["Melbourne", "Southbank", "Footscray"],
    acceptingNewParticipants: false,
    waitlistStatus: "long",
    earliestAvailability: "About 8 weeks",
    fundingTypes: ["Agency-managed", "Plan-managed"],
    ndisRegistered: true,
    accessReadinessScore: 68,
    transportFeasibility: "medium",
    responseTime: "Usually within 3 business days",
    evidenceStatus: "unknown",
    lastUpdated: "2026-04-10",
    telehealth: true,
    homeVisit: true,
    accessibleClinic: true,
    accessibleTransportSupported: true,
    isDemo: true,
    summary:
      "Employment pathway support. Availability limited; access-readiness details partly unverified.",
  },
];

export function filterDemoProviders(
  providers: DemoProvider[],
  options: {
    query?: string;
    service?: string;
    suburb?: string;
    noWaitlist?: boolean;
    availableThisWeek?: boolean;
    telehealth?: boolean;
    homeVisit?: boolean;
    accessibleClinic?: boolean;
    accessibleTransport?: boolean;
    agencyManaged?: boolean;
    planManaged?: boolean;
    selfManaged?: boolean;
    verified?: boolean;
  },
): DemoProvider[] {
  const q = options.query?.trim().toLowerCase() ?? "";
  const suburb = options.suburb?.trim().toLowerCase() ?? "";
  const service = options.service?.trim().toLowerCase() ?? "";

  return providers.filter((provider) => {
    const haystack = `${provider.name} ${provider.services.join(" ")} ${provider.suburbsServed.join(" ")}`.toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (suburb && !provider.suburbsServed.some((s) => s.toLowerCase().includes(suburb)))
      return false;
    if (service && !provider.services.some((s) => s.toLowerCase().includes(service)))
      return false;
    if (options.noWaitlist && provider.waitlistStatus !== "none") return false;
    if (options.availableThisWeek && provider.earliestAvailability !== "This week") return false;
    if (options.telehealth && !provider.telehealth) return false;
    if (options.homeVisit && !provider.homeVisit) return false;
    if (options.accessibleClinic && !provider.accessibleClinic) return false;
    if (options.accessibleTransport && !provider.accessibleTransportSupported) return false;
    if (options.agencyManaged && !provider.fundingTypes.includes("Agency-managed")) return false;
    if (options.planManaged && !provider.fundingTypes.includes("Plan-managed")) return false;
    if (options.selfManaged && !provider.fundingTypes.includes("Self-managed")) return false;
    if (options.verified && provider.evidenceStatus !== "verified") return false;
    return true;
  });
}
