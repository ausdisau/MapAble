/**
 * NSW NDIS Worker Check (NDISWC) guided official-portal lookup.
 *
 * This module deliberately does NOT query the restricted Worker Screening
 * Database, Service NSW accounts or the Office of the Children's Guardian.
 * Its sole role is to route a person to their lawful verification pathway and
 * explain official terms. No personal data, clearance number or credentials
 * are collected. Nothing here verifies an individual worker.
 *
 * Authoritative sources checked: 2026-11-02.
 */
export const NSW_NDISWC_OFFICIAL_LINKS = {
  ocg: "https://ocg.nsw.gov.au/ndiswc",
  workerStatus: "https://www.service.nsw.gov.au/transaction/ndiswc-check-status",
  registeredPortal: "https://www.ndiscommission.gov.au/registered-providers-portal-login",
  unregisteredPortal: "https://www.ndiscommission.gov.au/unregistered-providers-portal-login",
  participantPortal: "https://www.ndiscommission.gov.au/self-managed-participants-portal-login",
  workerScreening: "https://www.ndiscommission.gov.au/workforce/worker-screening",
  participants: "https://www.ndiscommission.gov.au/workforce/worker-screening/worker-screening-participants",
  registeredProviders: "https://www.ndiscommission.gov.au/workforce/worker-screening/worker-screening-registered-providers",
  whichPortal: "https://www.ndiscommission.gov.au/about-us/digital-transformation/ndis-commission-portal-new/which-portal",
  employerVerification: "https://ocg.nsw.gov.au/ndis-worker-check-ndiswc/ndiswc-apply-and-manage/application-processing-and-employer-verification",
  help: "https://ocg.nsw.gov.au/ndis-worker-check-ndiswc/ndiswc-help-feedback-privacy",
} as const;

export const NSW_NDISWC_PUBLIC_API_AVAILABLE = false as const;
export const NSW_NDISWC_LIVE_LOOKUP_ENABLED = false as const;
export const CURRENT_NDIS_SCREENING_STATUS = "NOT_INDEPENDENTLY_VERIFIED" as const;
export type PathwayAudience =
  | "nsw_worker"
  | "registered_provider"
  | "unregistered_provider"
  | "sole_trader"
  | "self_or_plan_managed_participant"
  | "supporter_or_coordinator"
  | "other_state_worker";
export type StatusContext = "nsw_application" | "national_screening";
export type NationalWorkerStatus =
  | "Clearance" | "Pending" | "Interim bar" | "Exclusion"
  | "Suspension" | "No valid clearance";
export type NswApplicationStatus =
  | "Draft" | "Visit a service centre" | "Under review"
  | "Pending verification" | "Under assessment" | "Risk assessment";
export type OfficialScreeningTerm = NationalWorkerStatus | NswApplicationStatus;
export interface OfficialPathway {
  readonly audience: PathwayAudience;
  readonly title: string;
  readonly description: string;
  readonly officialPortalLabel: string;
  readonly officialPortalUrl: string;
  readonly guidanceUrl: string;
  readonly steps: readonly string[];
  readonly canUsePublicWorkerNameSearch: false;
  readonly automaticallyVerifiedByMapAble: false;
  readonly requiresOfficialAuthorisation: boolean;
  readonly displayedWorkerStatus: typeof CURRENT_NDIS_SCREENING_STATUS;
  readonly sourceCheckedOn: "2026-11-02";
}
const shared = {
  canUsePublicWorkerNameSearch: false,
  automaticallyVerifiedByMapAble: false,
  displayedWorkerStatus: CURRENT_NDIS_SCREENING_STATUS,
  sourceCheckedOn: "2026-11-02",
} as const;

const pathways: Record<PathwayAudience, OfficialPathway> = {
  nsw_worker: {
    ...shared,
    audience: "nsw_worker",
    title: "I'm checking my own NSW NDIS Worker Check",
    description: "Only the worker can view their own NSW application or credential in their MyServiceNSW account. Use the Service NSW WEBSITE, not the mobile app.",
    officialPortalLabel: "Open official NSW NDIS Worker Check status instructions",
    officialPortalUrl: NSW_NDISWC_OFFICIAL_LINKS.workerStatus,
    guidanceUrl: NSW_NDISWC_OFFICIAL_LINKS.ocg,
    requiresOfficialAuthorisation: true,
    steps: [
      "Open the official Service NSW status page.",
      "Sign in directly to your own MyServiceNSW account on the Service NSW website.",
      "Select NDIS Worker Check, then Check your status.",
      "Your own application progress is not proof that you have a current clearance. An employer or eligible participant must verify through the linked national database.",
    ],
  },
  registered_provider: {
    ...shared,
    audience: "registered_provider",
    title: "I'm an authorised worker screening officer at a registered provider",
    description: "From 12 October 2026, registered and deregistered providers conduct new worker-screening activities in the NEW NDIS Commission Portal.",
    officialPortalLabel: "Go to the registered providers' portal entry",
    officialPortalUrl: NSW_NDISWC_OFFICIAL_LINKS.registeredPortal,
    guidanceUrl: NSW_NDISWC_OFFICIAL_LINKS.registeredProviders,
    requiresOfficialAuthorisation: true,
    steps: [
      "Use the organisation's approved Worker Screening Officer role, with the required digital identity and organisation authorisation.",
      "Link or verify the worker under your own organisation in the NDIS Worker Screening Database.",
      "Check the worker's exact status, expiry date and Eligible to work field for your current use.",
      "Record an appropriately restricted verification outcome under your organisation's lawful recordkeeping process; do not disclose the worker's protected details publicly.",
    ],
  },
  unregistered_provider: {
    ...shared,
    audience: "unregistered_provider",
    title: "I'm an authorised representative of an unregistered provider",
    description: "Unregistered providers continue their worker-screening activities in the existing NDIS Commission unregistered providers portal after 12 October 2026.",
    officialPortalLabel: "Go to the unregistered providers' portal entry",
    officialPortalUrl: NSW_NDISWC_OFFICIAL_LINKS.unregisteredPortal,
    guidanceUrl: NSW_NDISWC_OFFICIAL_LINKS.whichPortal,
    requiresOfficialAuthorisation: true,
    steps: [
      "Arrange authorised access to the Worker Screening Database as an NDIS worker-screening employer if you are eligible.",
      "Use the authorised unregistered provider portal to link the worker to your organisation.",
      "Check status and expiry in the national database. A worker's verbal statement or uploaded document is not an independent portal check.",
      "Check applicable role, employment and other statutory requirements separately.",
    ],
  },
  sole_trader: {
    ...shared,
    audience: "sole_trader",
    title: "I'm a sole-trader or self-employed NDIS worker",
    description: "An unregistered sole trader normally needs both their individual NSW worker-check application and authorised employer-side verification through the Commission's screening database.",
    officialPortalLabel: "Go to the unregistered providers' portal entry",
    officialPortalUrl: NSW_NDISWC_OFFICIAL_LINKS.unregisteredPortal,
    guidanceUrl: NSW_NDISWC_OFFICIAL_LINKS.workerScreening,
    requiresOfficialAuthorisation: true,
    steps: [
      "Apply for access to the Commission's worker-screening database under the correct employer/sole-trader pathway.",
      "Obtain the employer ID and include it in your NSW NDISWC application.",
      "Perform the authorised employer-verification step for your application in the portal.",
      "Check your own application progress through MyServiceNSW; do not assume that employer verification means clearance.",
    ],
  },
  self_or_plan_managed_participant: {
    ...shared,
    audience: "self_or_plan_managed_participant",
    title: "I'm a self-managed or plan-managed participant",
    description: "Participants who are eligible to access the national Worker Screening Database use the existing Self-managed Participants Portal. The NDIS Commission describes access application and worker-linking steps.",
    officialPortalLabel: "Go to the self-managed participants' portal entry",
    officialPortalUrl: NSW_NDISWC_OFFICIAL_LINKS.participantPortal,
    guidanceUrl: NSW_NDISWC_OFFICIAL_LINKS.participants,
    requiresOfficialAuthorisation: true,
    steps: [
      "Apply for your own authorised database access through the Commission's published process, if you do not already have it.",
      "Identify and link the worker you employ or engage according to portal instructions.",
      "Check the current worker status and expiry in the database; do not rely on an employer's ABN or MapAble's profile badge as clearance.",
      "Choose whether to engage the worker using your own preferences and any relevant legal rules; screening does not determine competence, compatibility, safety or availability.",
    ],
  },
  supporter_or_coordinator: {
    ...shared,
    audience: "supporter_or_coordinator",
    title: "I'm a supporter, support coordinator or other person",
    description: "Being a relative, coordinator or supporter does not automatically give you a participant's or worker's private screening information.",
    officialPortalLabel: "Read the NDIS Commission participant verification guidance",
    officialPortalUrl: NSW_NDISWC_OFFICIAL_LINKS.participants,
    guidanceUrl: NSW_NDISWC_OFFICIAL_LINKS.workerScreening,
    requiresOfficialAuthorisation: true,
    steps: [
      "Check whether you actually have a lawful, purpose-specific role to act for an employer or participant.",
      "If not, ask the participant or authorised employer to perform the official portal check rather than gathering worker credentials yourself.",
      "Assist with an accessible explanation or communication only to the extent the participant wants and permits.",
      "Never create a surrogate approval, infer the worker's status from public information or share private screening results with marketplace agents.",
    ],
  },
  other_state_worker: {
    ...shared,
    audience: "other_state_worker",
    title: "I live outside NSW",
    description: "NDIS Worker Screening Checks are nationally recognised, but workers apply, renew and check their own status through the screening unit in the state or territory where they live.",
    officialPortalLabel: "Find your state or territory Worker Screening Unit",
    officialPortalUrl: NSW_NDISWC_OFFICIAL_LINKS.workerScreening,
    guidanceUrl: NSW_NDISWC_OFFICIAL_LINKS.workerScreening,
    requiresOfficialAuthorisation: true,
    steps: [
      "Open the Commission's state and territory screening-unit directory.",
      "Select the unit for the jurisdiction where you live.",
      "Sign in to your own authorised application-status service.",
      "An employer or participant still uses the linked national screening database for independent status verification.",
    ],
  },
};

/** Pure official-link router; no network, worker identifiers or session access. */
export function getNdiswcPathway(audience: PathwayAudience): OfficialPathway {
  return pathways[audience];
}
export const NDISWC_AUDIENCES: readonly {
  readonly id: PathwayAudience;
  readonly label: string;
}[] = [
  { id: "nsw_worker", label: "Worker: check my own screening status" },
  { id: "registered_provider", label: "Registered provider: verify a linked worker" },
  { id: "unregistered_provider", label: "Unregistered provider: verify a linked worker" },
  { id: "sole_trader", label: "Sole trader / self-employed worker" },
  { id: "self_or_plan_managed_participant", label: "Self-managed or plan-managed participant" },
  { id: "supporter_or_coordinator", label: "Supporter or coordinator" },
  { id: "other_state_worker", label: "Worker living outside NSW" },
] as const;

export const OFFICIAL_SCREENING_TERMS: Readonly<Record<StatusContext, readonly {
  readonly label: OfficialScreeningTerm;
  readonly explanation: string;
}[]>> = {
  nsw_application: [
    { label: "Draft", explanation: "The application has been started but has not been completed." },
    { label: "Visit a service centre", explanation: "An online application requires the Service NSW identity and fee step." },
    { label: "Under review", explanation: "The NSW screening unit is reviewing the validity of the application." },
    { label: "Pending verification", explanation: "The NDIS employer has not yet verified the application in the national database. This is not a clearance." },
    { label: "Under assessment", explanation: "The NSW screening unit is assessing records or performing background checks." },
    { label: "Risk assessment", explanation: "The NSW screening unit is carrying out a risk assessment. Do not infer the final outcome." },
  ],
  national_screening: [
    { label: "Clearance", explanation: "An authorised database may report a clearance. The current expiry date and Eligible to work field must also be checked in context." },
    { label: "Pending", explanation: "A worker check is pending. Work while pending depends on the specific law, role and exceptions; do not infer eligibility from this label." },
    { label: "Interim bar", explanation: "A restriction is in force while the application is assessed. Follow the official portal's work prohibitions." },
    { label: "Exclusion", explanation: "An exclusion restricts work in relevant NDIS roles. Confirm the exact current scope through the official authority." },
    { label: "Suspension", explanation: "The worker's clearance is suspended. Follow the official portal's restrictions." },
    { label: "No valid clearance", explanation: "No valid clearance is recorded for the linked worker; this is not automatically an exclusion." },
  ],
};

/**
 * Explain a selected label in isolation. Selecting a label is NOT evidence
 * that a named individual has that status. Never produce "verified" here.
 */
export function explainOfficialScreeningTerm(context: StatusContext, label: string): {
  readonly found: boolean;
  readonly explanation: string;
  readonly observedWorkerStatus: typeof CURRENT_NDIS_SCREENING_STATUS;
  readonly userSelectionIsEvidence: false;
} {
  const item = OFFICIAL_SCREENING_TERMS[context].find((entry) => entry.label === label);
  return {
    found: Boolean(item),
    explanation: item?.explanation ?? "This term is not recognised for the selected official system. Check the portal directly.",
    observedWorkerStatus: CURRENT_NDIS_SCREENING_STATUS,
    userSelectionIsEvidence: false,
  };
}
