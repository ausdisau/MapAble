/**
 * State/territory NDIS Worker Screening Unit pathways.
 * ONLY directs users to government pages. It cannot verify any worker,
 * check clearance, infer work permission or collect identity documents.
 *
 * Separate nationally recognised NDIS Clearance from local WWC/WWVP rules.
 * Sources directly reviewed on 2 November 2026 (see docs).
 */
import {
  CURRENT_NDIS_SCREENING_STATUS,
  NSW_NDISWC_OFFICIAL_LINKS,
} from "@/lib/workers/ndiswc-lookup-guide";

export const SCREENING_JURISDICTIONS = [
  "NSW", "VIC", "ACT", "QLD", "WA", "SA", "TAS", "NT",
] as const;
export type ScreeningJurisdiction = typeof SCREENING_JURISDICTIONS[number];
export type LocalChecks = "SEPARATE_WWC_MAY_APPLY" |
  "WWVP_INCLUDES_OPTIONAL_NDIS_CLEARANCE" |
  "COMBINED_BLUE_CARD_OPTION" |
  "SEPARATE_WWCC_MAY_APPLY" |
  "CHECK_LOCAL_REQUIREMENTS";

export interface WorkerJurisdictionPathway {
  readonly jurisdiction: ScreeningJurisdiction;
  readonly title: string;
  readonly workerPrimaryUrl: string;
  readonly workerPrimaryLabel: string;
  readonly screeningUnitUrl: string;
  readonly summary: string;
  readonly applicationSteps: readonly string[];
  readonly localChecks: LocalChecks;
  readonly localCheckNote: string;
  readonly workWhilePending: "NO_CLEARANCE_NO_START_WITH_NARROW_EXCEPTIONS" |
    "VERIFY_CURRENT_STATE_RULES_NO_AUTOMATIC_PERMISSION";
  readonly helpWithoutPhone: readonly string[];
  readonly nationalVerificationUrl: typeof NSW_NDISWC_OFFICIAL_LINKS.workerScreening;
  readonly automaticClearanceVerified: false;
  readonly publicWorkerLookupAvailable: false;
  readonly observedScreeningStatus: typeof CURRENT_NDIS_SCREENING_STATUS;
  readonly sourceCheckedAt: "2026-11-02";
}
const common = {
  nationalVerificationUrl: NSW_NDISWC_OFFICIAL_LINKS.workerScreening,
  automaticClearanceVerified: false,
  publicWorkerLookupAvailable: false,
  observedScreeningStatus: CURRENT_NDIS_SCREENING_STATUS,
  sourceCheckedAt: "2026-11-02",
} as const;

const jurisdictionProfiles: Record<ScreeningJurisdiction, WorkerJurisdictionPathway> = {
  NSW: {
    ...common, jurisdiction: "NSW", title: "New South Wales — Office of the Children's Guardian",
    workerPrimaryUrl: NSW_NDISWC_OFFICIAL_LINKS.workerStatus,
    workerPrimaryLabel: "Check your own NSW NDISWC status on the Service NSW website",
    screeningUnitUrl: NSW_NDISWC_OFFICIAL_LINKS.ocg,
    summary: "The NSW Office of the Children's Guardian manages NDISWC. It is a digital credential accessed through MyServiceNSW on the website (not the Service NSW mobile app).",
    applicationSteps: [
      "Use the NSW OCG's instructions to apply for or renew your own NDISWC.",
      "Use the Service NSW website and your private MyServiceNSW login to check your application or credential.",
      "The authorised employer/eligible participant checks the national Worker Screening Database independently.",
    ],
    localChecks: "SEPARATE_WWC_MAY_APPLY",
    localCheckNote: "If work is child-related, check NSW Working with Children Check duties separately; the NDISWC does not automatically replace every other screening requirement.",
    workWhilePending: "VERIFY_CURRENT_STATE_RULES_NO_AUTOMATIC_PERMISSION",
    helpWithoutPhone: [
      "Use the NSW OCG official NDISWC information and Service NSW web account.",
      "Ask the relevant agency for accessible support; do not share passwords or identity documents with MapAble.",
    ],
  },
  VIC: {
    ...common, jurisdiction: "VIC", title: "Victoria — NDIS Worker Screening Unit / Service Victoria",
    workerPrimaryUrl: "https://www.vic.gov.au/ndis-worker-screening-check",
    workerPrimaryLabel: "Read the Victorian NDIS Check application and status instructions",
    screeningUnitUrl: "https://www.vic.gov.au/ndis-worker-screening-check",
    summary: "Workers apply through Service Victoria. An employer or eligible participant must verify the application through the NDIS Worker Screening Database. Victoria operates a no-clearance-no-start approach to risk-assessed roles, subject to applicable transitional arrangements.",
    applicationSteps: [
      "Open Victoria's official NDIS Worker Screening Check page and follow its Service Victoria link.",
      "Apply using your own account and nominate the correct employer ID or eligible participant identifier.",
      "Your nominated employer or participant verifies the application in the national database; unresolved verification may lead to withdrawal.",
      "Do not start regulated risk-assessed work without the required clearance unless the current legal transitional exception actually applies.",
    ],
    localChecks: "SEPARATE_WWC_MAY_APPLY",
    localCheckNote: "Victoria's NDIS Check does not replace the Victorian Working with Children Check (WWC). Child-related roles can require both checks.",
    workWhilePending: "NO_CLEARANCE_NO_START_WITH_NARROW_EXCEPTIONS",
    helpWithoutPhone: [
      "Service Victoria provides online assistance and an offline/manual application pathway if you cannot use smartphone identity verification.",
      "Never transfer identity documents to MapAble; use official Victorian channels.",
    ],
  },
  ACT: {
    ...common, jurisdiction: "ACT", title: "ACT — Working with Vulnerable People and NDIS",
    workerPrimaryUrl: "https://www.accesscanberra.act.gov.au/business-and-work/working-with-vulnerable-people/wwvp-and-the-ndis",
    workerPrimaryLabel: "Read the ACT WWVP and NDIS clearance requirements",
    screeningUnitUrl: "https://www.accesscanberra.act.gov.au/business-and-work/working-with-vulnerable-people",
    summary: "In the ACT, NDIS worker screening is administered through the Working with Vulnerable People (WWVP) scheme. An ACT WWVP card can indicate 'NDIS ACTIVITIES - Yes' when clearance has been granted, but WWVP registration and NDIS clearance are not interchangeable for every activity.",
    applicationSteps: [
      "Read the ACT 'WWVP and the NDIS' rules, then use Access Canberra's official WWVP application process.",
      "Where NDIS clearance is needed, select the NDIS clearance pathway and nominate an authorised employer listed in the national database.",
      "The employer verifies engagement in the national database before an NDIS clearance application proceeds.",
      "Do not assume a plain WWVP registration or card marked 'NDIS ACTIVITIES - No' establishes a current national NDIS Clearance.",
    ],
    localChecks: "WWVP_INCLUDES_OPTIONAL_NDIS_CLEARANCE",
    localCheckNote: "NDIS activities are regulated within ACT WWVP law. A separate NDIS clearance may be required for risk-assessed roles; an ACT WWVP card by itself is not a general substitute. Check any interstate-clearance and local WWVP requirements.",
    workWhilePending: "VERIFY_CURRENT_STATE_RULES_NO_AUTOMATIC_PERMISSION",
    helpWithoutPhone: [
      "Apply through the ACT Government Digital Account and Access Canberra's WWVP service.",
      "If digital identity verification is not accessible, Access Canberra describes in-person/postal ID routes and support; no documents go to MapAble.",
    ],
  },
  QLD: {
    ...common, jurisdiction: "QLD", title: "Queensland — Disability Worker Screening",
    workerPrimaryUrl: "https://www.workerscreening.qld.gov.au/workers/before-you-start",
    workerPrimaryLabel: "Check Queensland's disability-worker application steps",
    screeningUnitUrl: "https://www.workerscreening.qld.gov.au/",
    summary: "Queensland uses a Disability Worker Screening Portal and generally a 'no card, no start' approach where a clearance is required. Employer engagement verification forms part of an application.",
    applicationSteps: [
      "Read Queensland's 'Before you start' page, then sign in to the official Disability Worker Screening Portal.",
      "Your employing or proposed provider must verify the work engagement as required.",
      "Where the role involves working with children, check whether a Blue Card is also needed; a combined NDIS worker screening/Blue Card application pathway exists.",
      "Do not infer permission to start from 'application submitted' or 'pending'. Follow Queensland's current renewal and exception guidance.",
    ],
    localChecks: "COMBINED_BLUE_CARD_OPTION",
    localCheckNote: "Workers supporting children with disability may require BOTH disability worker screening and a Blue Card; Queensland offers a combined application, not an automatic substitution.",
    workWhilePending: "NO_CLEARANCE_NO_START_WITH_NARROW_EXCEPTIONS",
    helpWithoutPhone: [
      "The Queensland government provides a worker-portal user guide, Easy Read resources and manual forms if needed.",
      "Use the official portal or Disability Worker Screening Unit for accessibility support; do not supply MapAble with identity documents.",
    ],
  },
  WA: {
    ...common, jurisdiction: "WA", title: "Western Australia — Department of Communities / DoTDirect",
    workerPrimaryUrl: "https://www.wa.gov.au/organisation/department-of-communities/applying-ndis-check",
    workerPrimaryLabel: "Read WA's Applying for an NDIS Check instructions",
    screeningUnitUrl: "https://www.wa.gov.au/organisation/department-of-communities/ndis-worker-screening-check",
    summary: "WA's NDIS Worker Screening Unit is within the Department of Communities. Workers apply or renew using DoTDirect and follow identity verification instructions. National clearance remains separate from employment and service suitability.",
    applicationSteps: [
      "Open WA's official 'Applying for an NDIS Check' instructions.",
      "Apply or renew via DoTDirect, using your own account, then complete the stated identity-verification steps.",
      "Follow the WA screening unit and relevant employer/participant instructions on verifying engagement.",
      "Check the NDIS Worker Screening Database through your authorised employer or participant account for an independently current outcome.",
    ],
    localChecks: "SEPARATE_WWCC_MAY_APPLY",
    localCheckNote: "WA Working with Children Check requirements can apply in addition to an NDIS worker clearance for child-related work; they are different statutory checks.",
    workWhilePending: "VERIFY_CURRENT_STATE_RULES_NO_AUTOMATIC_PERMISSION",
    helpWithoutPhone: [
      "WA provides government NDIS Check resources, translated/Easy Read material and application guidance.",
      "If online steps are inaccessible, request an authorised alternative from the screening unit; never share proof-of-identity data with MapAble.",
    ],
  },
  SA: {
    ...common, jurisdiction: "SA", title: "South Australia — Screening Unit",
    workerPrimaryUrl: "https://www.sa.gov.au/topics/rights-and-law/rights-and-responsibilities/screening-checks",
    workerPrimaryLabel: "Find South Australian screening check instructions",
    screeningUnitUrl: "https://www.sa.gov.au/topics/rights-and-law/rights-and-responsibilities/screening-checks",
    summary: "Follow SA's authorised screening unit for NDIS worker-check applications and renewals. The NDIS Commission's national guidance controls employer/participant verification.",
    applicationSteps: [
      "Open SA government screening information.",
      "Follow the NDIS worker check application pathway for your role.",
      "An authorised employer/participant checks the linked worker's current status in the national database.",
    ],
    localChecks: "CHECK_LOCAL_REQUIREMENTS",
    localCheckNote: "Check child and other locally regulated activity screening separately if relevant.",
    workWhilePending: "VERIFY_CURRENT_STATE_RULES_NO_AUTOMATIC_PERMISSION",
    helpWithoutPhone: ["Use SA government's official accessibility and support channels."],
  },
  TAS: {
    ...common, jurisdiction: "TAS", title: "Tasmania — Registration to Work with Vulnerable People",
    workerPrimaryUrl: "https://www.justice.tas.gov.au/rwvp",
    workerPrimaryLabel: "Find Tasmanian vulnerable-person worker-screening guidance",
    screeningUnitUrl: "https://www.justice.tas.gov.au/rwvp",
    summary: "Tasmania administers work-with-vulnerable-people registration. Follow the national Commission pathway for NDIS worker-clearance status and relevant Tasmania requirements.",
    applicationSteps: [
      "Open the Tasmanian official registration/screening site.",
      "Check which NDIS worker screening and vulnerable-person obligations apply.",
      "Have an authorised employer/participant verify current status in the national database.",
    ],
    localChecks: "CHECK_LOCAL_REQUIREMENTS",
    localCheckNote: "Check local child/vulnerable person registration obligations separately; do not infer NDIS Clearance from an unverified card or claim.",
    workWhilePending: "VERIFY_CURRENT_STATE_RULES_NO_AUTOMATIC_PERMISSION",
    helpWithoutPhone: ["Use the Tasmanian government registration guidance and accessibility contact pathway."],
  },
  NT: {
    ...common, jurisdiction: "NT", title: "Northern Territory — SAFE NT",
    workerPrimaryUrl: "https://pfes.nt.gov.au/NDISCheck",
    workerPrimaryLabel: "Find Northern Territory NDIS Check instructions",
    screeningUnitUrl: "https://pfes.nt.gov.au/NDISCheck",
    summary: "The NT worker screening pathway is administered through SAFE NT. Review current local application rules and the national database for authorised status verification.",
    applicationSteps: [
      "Open the SAFE NT NDIS Check page.",
      "Follow the Northern Territory application and identity verification instructions.",
      "An authorised employer or participant checks the current clearance in the national database.",
    ],
    localChecks: "CHECK_LOCAL_REQUIREMENTS",
    localCheckNote: "Check local Working with Children / Ochre Card requirements where work involves children.",
    workWhilePending: "VERIFY_CURRENT_STATE_RULES_NO_AUTOMATIC_PERMISSION",
    helpWithoutPhone: ["Use the Northern Territory's SAFE NT information and support channels."],
  },
};

/** No hidden network, accounts, worker names or application IDs. */
export function getWorkerJurisdictionPathway(
  jurisdiction: ScreeningJurisdiction,
): WorkerJurisdictionPathway {
  return jurisdictionProfiles[jurisdiction];
}
