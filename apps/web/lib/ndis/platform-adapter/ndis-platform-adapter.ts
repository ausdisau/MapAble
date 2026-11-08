/**
 * MapAble NDIS Adapter: explicit integration capabilities, NOT an NDIA client.
 * It never reads a live provider, worker, participant or government record.
 *
 * Do not infer government approval, NDIS registration, screening clearance,
 * provider service quality or individual suitability from a local feature flag.
 */
export type NdisAdapterEnvironment = {
  NODE_ENV?: string;
  MAPABLE_NDIS_PLATFORM_ADAPTER_PREVIEW_ENABLED?: string;
  NDIA_REAL_SUBMISSION_ENABLED?: string;
};

export type NdisAdapterLane =
  | "ndia_transactions"
  | "public_provider_directory"
  | "worker_screening"
  | "digital_platform_registration";

export type NdisAdapterEvidenceStatus =
  | "not_independently_verified"
  | "public_directory_reference_only"
  | "authorised_portal_required"
  | "synthetic_only";

export type NdisAdapterLaneStatus = {
  id: NdisAdapterLane;
  title: string;
  evidence: NdisAdapterEvidenceStatus;
  officialSource: string;
  limitations: string;
  allowsRealTransaction: false;
  allowsIndividualWorkerClearanceDecision: false;
};

export type NdisPlatformAdapterStatus = {
  name: "MapAble NDIS Integration Adapter";
  version: "v1-evidence-first";
  mode: "disabled" | "synthetic_only" | "production_preview_blocked";
  synthetic: true;
  productionApproved: false;
  verifiedNDIAConnection: false;
  verifiedPlatformRegistration: false;
  canSubmitClaim: false;
  canAssignWorker: false;
  canDetermineEligibility: false;
  requiresHumanReview: true;
  ndiaLegacySubmissionFlagObserved: boolean;
  lanes: NdisAdapterLaneStatus[];
  notice: string;
};

const OFFICIAL_SOURCES = {
  ndia: "https://ndis.gov.au/providers/working-provider/using-provider-portals/how-connect-our-systems",
  provider: "https://www.ndiscommission.gov.au/provider-registration/find-registered-provider",
  screening: "https://www.ndiscommission.gov.au/workforce/worker-screening",
  registration: "https://www.ndiscommission.gov.au/about-us/ndis-commission-reform-hub/mandatory-registration/mandatory-registration-digital",
} as const;

export function getNdisPlatformAdapterStatus(
  environment: NdisAdapterEnvironment = process.env,
): NdisPlatformAdapterStatus {
  const previewRequested =
    environment.MAPABLE_NDIS_PLATFORM_ADAPTER_PREVIEW_ENABLED === "true";
  const mode: NdisPlatformAdapterStatus["mode"] =
    previewRequested && environment.NODE_ENV === "production"
      ? "production_preview_blocked"
      : previewRequested
        ? "synthetic_only"
        : "disabled";

  return {
    name: "MapAble NDIS Integration Adapter",
    version: "v1-evidence-first",
    mode,
    synthetic: true,
    productionApproved: false,
    verifiedNDIAConnection: false,
    verifiedPlatformRegistration: false,
    canSubmitClaim: false,
    canAssignWorker: false,
    canDetermineEligibility: false,
    requiresHumanReview: true,
    ndiaLegacySubmissionFlagObserved:
      environment.NDIA_REAL_SUBMISSION_ENABLED === "true",
    lanes: [
      {
        id: "ndia_transactions",
        title: "NDIA digital partnership APIs",
        evidence: mode === "synthetic_only"
          ? "synthetic_only"
          : "not_independently_verified",
        officialSource: OFFICIAL_SOURCES.ndia,
        limitations:
          "Authorised API specifications, partner eligibility, authentication and cyber clearance are not evidenced. No real calls are available.",
        allowsRealTransaction: false,
        allowsIndividualWorkerClearanceDecision: false,
      },
      {
        id: "public_provider_directory",
        title: "NDIS Commission provider register",
        evidence: "public_directory_reference_only",
        officialSource: OFFICIAL_SOURCES.provider,
        limitations:
          "Public provider records are separate from NDIA API access. A directory entry does not verify a particular worker, service availability or quality. Live register import is not performed here.",
        allowsRealTransaction: false,
        allowsIndividualWorkerClearanceDecision: false,
      },
      {
        id: "worker_screening",
        title: "Individual NDIS worker screening",
        evidence: "authorised_portal_required",
        officialSource: OFFICIAL_SOURCES.screening,
        limitations:
          "A worker's current clearance requires authorised Worker Screening Database evidence. Self-reports, uploaded documents and provider registration do not establish clearance.",
        allowsRealTransaction: false,
        allowsIndividualWorkerClearanceDecision: false,
      },
      {
        id: "digital_platform_registration",
        title: "NDIS digital platform registration (0137)",
        evidence: "not_independently_verified",
        officialSource: OFFICIAL_SOURCES.registration,
        limitations:
          "Whether MapAble's particular operating model requires registration and its actual registered status must be verified. This contract grants no authority to offer NDIS supports.",
        allowsRealTransaction: false,
        allowsIndividualWorkerClearanceDecision: false,
      },
    ],
    notice:
      "Status and source navigator only. No government portal or worker database was queried. Never describe these flags as official registration or approved API access.",
  };
}

export type SyntheticNdisJourneyInput = {
  synthetic: true;
  scenarioId: string;
  support: "daily_living" | "transport" | "community_access";
  communication: "aac" | "text" | "auslan" | "spoken";
  requestedHumanAssistance: boolean;
};

export type SyntheticNdisJourneyResult = {
  mode: "synthetic_only";
  scenarioId: string;
  service: SyntheticNdisJourneyInput["support"];
  communication: SyntheticNdisJourneyInput["communication"];
  humanSupportRequested: boolean;
  providerRegistration: "not_checked";
  workerScreening: "not_independently_verified";
  competency: "not_verified";
  availability: "not_confirmed";
  participantAuthority: "not_established";
  ndiaClaim: "not_submitted";
  booking: "not_created";
  humanReviewRequired: true;
  simulated: true;
  nextSteps: readonly string[];
};

/**
 * A strict demo contract to exercise the platform UI without processing real
 * health data, provider identities, NDIS numbers or worker identities.
 */
export function previewSyntheticNdisJourney(
  input: unknown,
  environment: NdisAdapterEnvironment = process.env,
): SyntheticNdisJourneyResult {
  if (getNdisPlatformAdapterStatus(environment).mode !== "synthetic_only") {
    throw new Error("MAPABLE_NDIS_ADAPTER_PREVIEW_DISABLED");
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("MAPABLE_NDIS_ADAPTER_SYNTHETIC_INPUT_REQUIRED");
  }

  const record = input as Partial<SyntheticNdisJourneyInput>;
  const permitted = [
    "synthetic",
    "scenarioId",
    "support",
    "communication",
    "requestedHumanAssistance",
  ];
  const supplied = Object.keys(record);
  if (
    supplied.length !== permitted.length ||
    supplied.some((key) => !permitted.includes(key))
  ) {
    throw new Error("MAPABLE_NDIS_ADAPTER_SYNTHETIC_FIELDS_ONLY");
  }
  if (
    record.synthetic !== true ||
    typeof record.scenarioId !== "string" ||
    !/^demo_[A-Za-z0-9_-]{1,64}$/.test(record.scenarioId) ||
    !["daily_living", "transport", "community_access"].includes(record.support ?? "") ||
    !["aac", "text", "auslan", "spoken"].includes(record.communication ?? "") ||
    typeof record.requestedHumanAssistance !== "boolean"
  ) {
    throw new Error("MAPABLE_NDIS_ADAPTER_SYNTHETIC_PAYLOAD_INVALID");
  }

  return {
    mode: "synthetic_only",
    scenarioId: record.scenarioId,
    service: record.support as SyntheticNdisJourneyInput["support"],
    communication: record.communication as SyntheticNdisJourneyInput["communication"],
    humanSupportRequested: record.requestedHumanAssistance,
    providerRegistration: "not_checked",
    workerScreening: "not_independently_verified",
    competency: "not_verified",
    availability: "not_confirmed",
    participantAuthority: "not_established",
    ndiaClaim: "not_submitted",
    booking: "not_created",
    humanReviewRequired: true,
    simulated: true,
    nextSteps: [
      "Confirm the participant's wishes and communication preferences",
      "Check actual provider registration independently through the official register",
      "Verify worker screening through an authorised source, when lawful and relevant",
      "Verify competence, availability and the support agreement separately",
      "Use a human-reviewed workflow; no NDIA claim or booking has been made",
    ],
  };
}
