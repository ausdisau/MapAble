export type CanvasStatus = "MVP" | "Next" | "Advanced" | "Governance";

export type EcosystemLink =
  | "Care"
  | "Transport"
  | "Core"
  | "Jobs"
  | "PlanOps"
  | "Access Pass"
  | "Digital Twin"
  | "Academy";

export type CanvasModule =
  | "care"
  | "transport"
  | "access"
  | "employment"
  | "core"
  | "jobs"
  | "planops";

export type CanvasBlock = {
  id: string;
  title: string;
  description: string;
  status: CanvasStatus;
  ecosystemLinks: EcosystemLink[];
  unlocks: string;
  modules: CanvasModule[];
  href?: string;
};

export type JourneyStep = {
  step: number;
  title: string;
  description: string;
};

export type TrustPrinciple = {
  title: string;
  description: string;
};

export type DigitalTwinCard = {
  title: string;
  description: string;
};

export type MetricItem = { label: string };

export type MetricGroup = {
  title: string;
  metrics: MetricItem[];
};

export type RoadmapPhase = {
  phase: string;
  title: string;
  items: string[];
};

export const positioningLines = {
  thesis:
    "Do not just book support. Book the whole journey.",
  contrast:
    "Hireup helps people find and manage support workers. MapAble helps people plan, verify, travel to, receive, confirm, pay for, review, and improve support in the real world.",
  supporting:
    "Not just a worker marketplace. A full journey layer for accessible support.",
  tagline:
    "A care, transport, access, and trust system for disability support that works in the real world.",
};

export const careOnlyPlatformItems = [
  "Worker search",
  "Basic profile matching",
  "Shift booking",
  "Platform messaging",
  "Payment admin",
  "Limited visibility into transport and access barriers",
];

export const mapableCompleteSupportItems = [
  "Access-fit matching",
  "Care + accessible transport bundles",
  "Worker capability passport",
  "Participant-controlled Access Pass",
  "First shift trial",
  "Live shift companion",
  "Care team builder",
  "NDIS-aware budget guardrails",
  "Service confirmation and attestations",
  "Support coordinator command centre",
  "Digital twin access data",
  "Rights and complaints pathway",
];

export const canvasBlocks: CanvasBlock[] = [
  {
    id: "access-pass",
    title: "Access Pass",
    description:
      "Participant-controlled access needs, communication preferences, transport notes, routines, and support preferences.",
    status: "MVP",
    ecosystemLinks: ["Access Pass", "Core"],
    unlocks: "Consent-controlled sharing before any match or booking.",
    modules: ["care", "access", "core"],
    href: "/access",
  },
  {
    id: "access-fit-matching",
    title: "Access-Fit Matching",
    description:
      "Match workers by access needs, communication, support skills, cultural preferences, transport feasibility, and environment.",
    status: "MVP",
    ecosystemLinks: ["Care", "Access Pass", "Core"],
    unlocks: "Fewer mismatches and safer first connections.",
    modules: ["care", "access", "employment", "core"],
    href: "/care",
  },
  {
    id: "verified-worker-passport",
    title: "Verified Worker Passport",
    description:
      "Show evidence-backed worker capability: screening, training, experience, credentials, support preferences, and verification status.",
    status: "MVP",
    ecosystemLinks: ["Care", "Jobs", "Academy"],
    unlocks: "Transparent capability before assignment.",
    modules: ["care", "employment"],
    href: "/care",
  },
  {
    id: "care-transport-bundle",
    title: "Care + Transport Bundle",
    description:
      "Book the worker, accessible ride, pickup notes, return trip, and buffer time in one flow.",
    status: "MVP",
    ecosystemLinks: ["Care", "Transport"],
    unlocks: "Whole-journey booking instead of separate admin.",
    modules: ["care", "transport"],
    href: "/transport",
  },
  {
    id: "first-shift-trial",
    title: "First Shift Trial",
    description:
      "Structure the first shift with preparation, tasks, boundaries, compatibility review, and rematch options.",
    status: "Next",
    ecosystemLinks: ["Care"],
    unlocks: "Lower-risk starts for participants and workers.",
    modules: ["care"],
    href: "/care",
  },
  {
    id: "live-shift-companion",
    title: "Live Shift Companion",
    description:
      "Support the shift itself with arrival, task checklist, communication notes, incident shortcut, transport status, and confirmation.",
    status: "Next",
    ecosystemLinks: ["Care", "Transport", "Core"],
    unlocks: "Real-time support delivery, not just booking.",
    modules: ["care", "transport"],
    href: "/care",
  },
  {
    id: "care-team-builder",
    title: "Care Team Builder",
    description:
      "Build a participant-approved team with primary, backup, and emergency workers.",
    status: "Next",
    ecosystemLinks: ["Care"],
    unlocks: "Continuity when regular workers are unavailable.",
    modules: ["care"],
    href: "/care",
  },
  {
    id: "budget-guardrails",
    title: "Budget Guardrails",
    description:
      "Show estimated costs, line item labels, invoice checks, transport costs, and plan-manager export prompts.",
    status: "MVP",
    ecosystemLinks: ["Care", "PlanOps", "Core"],
    unlocks: "Clear pricing before commitment — not NDIS funding decisions.",
    modules: ["care", "planops", "core"],
    href: "/care",
  },
  {
    id: "reliability-engine",
    title: "Reliability Engine",
    description:
      "Track response time, on-time arrival, cancellations, no-shows, completion rates, and participant rebooking.",
    status: "Next",
    ecosystemLinks: ["Care", "Transport", "Core"],
    unlocks: "Accountability beyond star ratings.",
    modules: ["care", "transport"],
    href: "/transport",
  },
  {
    id: "service-attestations",
    title: "Service Attestations",
    description:
      "Record service completion, participant confirmation, worker acceptance, invoice status, dispute windows, and payout readiness.",
    status: "MVP",
    ecosystemLinks: ["Care", "Core", "PlanOps"],
    unlocks: "Governed payouts after service is confirmed.",
    modules: ["care", "planops", "core"],
    href: "/care",
  },
  {
    id: "coordinator-command-centre",
    title: "Coordinator Command Centre",
    description:
      "Give support coordinators visibility across requests, workers, transport, budgets, invoices, issues, and outcomes.",
    status: "Advanced",
    ecosystemLinks: ["Care", "Transport", "PlanOps", "Core"],
    unlocks: "Consent-based oversight for coordinators.",
    modules: ["care", "planops", "core"],
    href: "/support-coordinator",
  },
  {
    id: "rights-navigator",
    title: "Rights Navigator",
    description:
      "Help users organise concerns, complaint timelines, evidence, escalation options, and trusted sharing.",
    status: "Governance",
    ecosystemLinks: ["Core"],
    unlocks: "Clear pathways when something goes wrong.",
    modules: ["employment", "care", "core"],
    href: "/help",
  },
];

export const journeySteps: JourneyStep[] = [
  {
    step: 1,
    title: "Participant creates Access Pass",
    description: "Share only what is needed for matching and delivery.",
  },
  {
    step: 2,
    title: "Participant requests support",
    description: "Describe tasks, timing, location, and access context.",
  },
  {
    step: 3,
    title: "MapAble runs access-fit matching",
    description: "Workers ranked by capability, transport, and preferences.",
  },
  {
    step: 4,
    title: "Participant reviews shortlist room",
    description: "Compare profiles with plain-language summaries.",
  },
  {
    step: 5,
    title: "Transport-aware roster check runs",
    description: "Confirm feasible pickup, travel time, and vehicle fit.",
  },
  {
    step: 6,
    title: "First shift trial is booked",
    description: "Structured start with clear boundaries and tasks.",
  },
  {
    step: 7,
    title: "Live shift companion supports delivery",
    description: "Checklists, notes, transport status, and incident shortcuts.",
  },
  {
    step: 8,
    title: "Participant confirms service",
    description: "Plain-language confirmation of what was delivered.",
  },
  {
    step: 9,
    title: "Attestation and invoice are created",
    description: "Evidence-linked records for review and export.",
  },
  {
    step: 10,
    title: "Payout eligibility is reviewed",
    description: "Transfers only after gates pass — not before service.",
  },
  {
    step: 11,
    title: "Feedback improves matching",
    description: "Outcomes inform future access-fit recommendations.",
  },
  {
    step: 12,
    title: "Support coordinator sees outcome",
    description: "Consent-based visibility for authorised coordinators.",
  },
];

export const trustPrinciples: TrustPrinciple[] = [
  {
    title: "Consent first",
    description: "Sensitive information is shared only with explicit participant control.",
  },
  {
    title: "Role-based access",
    description: "Workers, providers, and coordinators see only what their role requires.",
  },
  {
    title: "Worker verification",
    description: "Screening and credentials are tracked with clear status — not implied.",
  },
  {
    title: "Pricing transparency",
    description: "Line items, transport, and platform fees visible before payment.",
  },
  {
    title: "Complaint pathway",
    description: "Rights Navigator and support tickets with neutral, procedural language.",
  },
  {
    title: "Human review for high-risk workflows",
    description: "Safeguarding, disputes, and high-value payouts require human decisions.",
  },
  {
    title: "Audit trail",
    description: "Material actions on bookings, consent, and payments are logged.",
  },
  {
    title: "Privacy by design",
    description: "Need-to-know defaults; no silent broad sharing of access data.",
  },
  {
    title: "Accessibility by default",
    description: "WCAG-oriented patterns; formal conformance claims require evidence.",
  },
];

export const trustAutomationQuote =
  "MapAble should never silently automate high-impact decisions about safety, eligibility, payments, complaints, or sensitive disclosures.";

export const digitalTwinCards: DigitalTwinCard[] = [
  {
    title: "Participant home access notes",
    description: "Entry, parking, paths, and communication at the door.",
  },
  {
    title: "Clinic and venue access profiles",
    description: "Structured access for recurring appointments.",
  },
  {
    title: "Workplace access details",
    description: "Employer and job-site context for employment support.",
  },
  {
    title: "Pickup and drop-off points",
    description: "Exact meeting points without over-sharing to everyone.",
  },
  {
    title: "Bathroom and path-of-travel information",
    description: "Practical mobility and facility notes.",
  },
  {
    title: "Sensory and communication environment",
    description: "Noise, lighting, and preferred communication modes.",
  },
  {
    title: "Last verified date",
    description: "Community and participant updates with moderation.",
  },
  {
    title: "Confidence score",
    description: "How fresh and corroborated the access data is.",
  },
];

export const digitalTwinMicrocopy =
  "Support happens somewhere. MapAble helps check whether that somewhere works.";

export const metricGroups: MetricGroup[] = [
  {
    title: "Participant metrics",
    metrics: [
      { label: "Time to first suitable match" },
      { label: "Care + transport completion rate" },
      { label: "First shift continuation rate" },
      { label: "Participant confidence score" },
      { label: "Complaint resolution time" },
    ],
  },
  {
    title: "Worker metrics",
    metrics: [
      { label: "Completed shifts" },
      { label: "Response time" },
      { label: "Training completion" },
      { label: "Reliability score" },
      { label: "Payout processing time" },
    ],
  },
  {
    title: "Provider and coordinator metrics",
    metrics: [
      { label: "Request-to-first-appointment conversion" },
      { label: "Invoice accuracy" },
      { label: "Transport failure reduction" },
      { label: "Service gap visibility" },
      { label: "Plan utilisation visibility" },
    ],
  },
  {
    title: "Ecosystem metrics",
    metrics: [
      { label: "Verified access profiles" },
      { label: "Completed attestations" },
      { label: "Community access updates" },
      { label: "Thin-market requests resolved" },
      { label: "Repeat bookings" },
    ],
  },
];

export const roadmapPhases: RoadmapPhase[] = [
  {
    phase: "Phase 1",
    title: "Beat search and booking",
    items: [
      "Access-Fit Matching",
      "Care + Transport Bundle",
      "Worker Capability Passport",
      "First Shift Trial",
      "Budget Guardrails",
    ],
  },
  {
    phase: "Phase 2",
    title: "Beat trust and reliability",
    items: [
      "Reliability Engine",
      "Care Team Builder",
      "Live Shift Companion",
      "Attestation Layer",
      "Rights Navigator",
    ],
  },
  {
    phase: "Phase 3",
    title: "Beat the category",
    items: [
      "Support Coordinator Command Centre",
      "Accessibility Digital Twin",
      "Thin-Market Support Missions",
      "Academy",
      "Hybrid Workforce Model",
    ],
  },
];

export const boundaryNotice = {
  body: "MapAble provides coordination, access information, and service workflow support. It does not replace emergency services, legal advice, clinical advice, safeguarding authorities, or NDIS funding decisions.",
  emergency: "If someone is in immediate danger, call 000.",
};

export const providerJourneyStepRange = { from: 6, to: 10 };

export const providerBlockIds = [
  "verified-worker-passport",
  "reliability-engine",
  "service-attestations",
  "coordinator-command-centre",
  "budget-guardrails",
];
