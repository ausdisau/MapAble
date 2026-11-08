/**
 * NDIA integration boundary, version 1: no public claims of government access.
 *
 * This is deliberately NOT an NDIA endpoint schema, authentication client, or
 * transport. Authorised technical specifications are supplied after NDIA DPO
 * onboarding, and may not be inferred from public portal pages.
 *
 * The only supported operation is a synthetic LOCAL preview.
 */
export type NdiaGatewayEnv = {
  NODE_ENV?: string;
  MAPABLE_NDIA_ADAPTER_SYNTHETIC_ENABLED?: string;
  NDIA_REAL_SUBMISSION_ENABLED?: string;
};

export type NdiaReadiness = {
  lane: "ndia_provider_api";
  mode: "disabled" | "synthetic_only" | "production_preview_blocked";
  accessEvidence: "not_independently_verified";
  providerPartnerEvidence: "not_independently_verified";
  endpointContract: "not_independently_verified";
  participantDataAccess: false;
  canTransmit: false;
  productionApproved: false;
  legacySubmissionFlagObserved: boolean;
  blockers: string[];
};

/** Flags do not establish NDIA approval, partner eligibility, or API health. */
export function getNdiaGatewayReadiness(
  environment: NdiaGatewayEnv = process.env,
): NdiaReadiness {
  const previewRequested =
    environment.MAPABLE_NDIA_ADAPTER_SYNTHETIC_ENABLED === "true";
  const production = environment.NODE_ENV === "production";
  const mode: NdiaReadiness["mode"] = production && previewRequested
    ? "production_preview_blocked"
    : previewRequested && !production
      ? "synthetic_only"
      : "disabled";

  return {
    lane: "ndia_provider_api",
    mode,
    accessEvidence: "not_independently_verified",
    providerPartnerEvidence: "not_independently_verified",
    endpointContract: "not_independently_verified",
    participantDataAccess: false,
    canTransmit: false,
    productionApproved: false,
    legacySubmissionFlagObserved:
      environment.NDIA_REAL_SUBMISSION_ENABLED === "true",
    blockers: [
      "NDIA digital partnership and approved provider relationship not evidenced by this adapter",
      "NDIA-issued OpenAPI specifications, testing, and cyber clearance not evidenced",
      "No authorised identity/token or transport contract is implemented",
      "Human review and privacy/participant authority need independent assurance",
      ...(production && previewRequested
        ? ["Synthetic preview cannot be enabled in production"]
        : []),
      ...(environment.NDIA_REAL_SUBMISSION_ENABLED === "true"
        ? ["Legacy submission flag is on; it is NOT evidence of NDIA access"]
        : []),
    ],
  };
}

export type SyntheticClaimPreviewInput = {
  synthetic: true;
  /** Must start with demo_; never pass an invoice or participant identifier. */
  testCaseId: string;
  lineCount: number;
  totalCents: number;
};

export type SyntheticClaimPreview = {
  lane: "ndia_provider_api";
  mode: "synthetic_only";
  result: "local_validation_only";
  testCaseId: string;
  lineCount: number;
  totalCents: number;
  notSubmitted: true;
  governmentReference: null;
  reason: "Not sent to NDIA. Fictional input only.";
  humanReviewRequired: true;
};

/**
 * Uses a strict allowlist to prevent accidental inclusion of real identities,
 * patient numbers, invoice bodies or credentials in a test payload.
 */
export function previewNdiaClaimLocally(
  input: unknown,
  environment: NdiaGatewayEnv = process.env,
): SyntheticClaimPreview {
  if (getNdiaGatewayReadiness(environment).mode !== "synthetic_only") {
    throw new Error("NDIA_SYNTHETIC_PREVIEW_DISABLED");
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("NDIA_SYNTHETIC_INPUT_REQUIRED");
  }
  const fields = Object.keys(input);
  const allowed = ["synthetic", "testCaseId", "lineCount", "totalCents"];
  if (fields.length !== allowed.length ||
      fields.some((key) => !allowed.includes(key))) {
    throw new Error("NDIA_SYNTHETIC_FIELDS_ONLY");
  }
  const record = input as Partial<SyntheticClaimPreviewInput>;
  if (
    record.synthetic !== true ||
    typeof record.testCaseId !== "string" ||
    !/^demo_[A-Za-z0-9_-]{1,64}$/.test(record.testCaseId) ||
    !Number.isSafeInteger(record.lineCount) ||
    (record.lineCount as number) < 1 ||
    (record.lineCount as number) > 100 ||
    !Number.isSafeInteger(record.totalCents) ||
    (record.totalCents as number) < 0 ||
    (record.totalCents as number) > 100000000
  ) {
    throw new Error("NDIA_SYNTHETIC_PAYLOAD_INVALID");
  }

  return {
    lane: "ndia_provider_api",
    mode: "synthetic_only",
    result: "local_validation_only",
    testCaseId: record.testCaseId,
    lineCount: record.lineCount as number,
    totalCents: record.totalCents as number,
    notSubmitted: true,
    governmentReference: null,
    reason: "Not sent to NDIA. Fictional input only.",
    humanReviewRequired: true,
  };
}

/** Real submission has no implementation in this adapter, by design. */
export function assertNdiaTransportNotImplemented(): never {
  throw new Error("NDIA_AUTHORISED_TRANSPORT_NOT_IMPLEMENTED");
}
