import type { OfficialNdisScreeningOutcome } from "@prisma/client";

import { DEFAULT_SCREENING_DISPLAY } from "@/lib/config/capability-passport";

export const OFFICIAL_NDIS_SCREENING_OUTCOMES = [
  "clearance",
  "pending",
  "interim_bar",
  "exclusion",
  "suspension",
  "no_valid_clearance",
  "not_independently_verified",
] as const;

export type OfficialScreeningOutcome = (typeof OFFICIAL_NDIS_SCREENING_OUTCOMES)[number];

export const NON_OVERRIDABLE_SCREENING_OUTCOMES: ReadonlySet<OfficialScreeningOutcome> =
  new Set(["exclusion", "interim_bar", "suspension"]);

export type ScreeningRecordView = {
  officialOutcome: OfficialScreeningOutcome | OfficialNdisScreeningOutcome;
  expiresAt: Date | string | null;
  eligibleToWork: boolean | null;
  identityLinked: boolean;
  source: string;
  reviewedAt: Date | string | null;
};

export type ScreeningGatewayResult = {
  displayStatus: string;
  officialOutcome: OfficialScreeningOutcome;
  eligibleToWork: boolean | null;
  identityLinked: boolean;
  independentlyVerified: boolean;
  legalProhibition: boolean;
  reasonCodes: string[];
  sourceRefs: string[];
};

function assertNever(value: never): never {
  throw new Error(`Unhandled screening outcome: ${String(value)}`);
}

export function isOfficialScreeningOutcome(
  value: string,
): value is OfficialScreeningOutcome {
  return (OFFICIAL_NDIS_SCREENING_OUTCOMES as readonly string[]).includes(value);
}

/**
 * Never infer clearance from screenshots, applications, provider relationship,
 * mock presentations, academy enrolment, or the absence of banning orders.
 * No Worker Screening Database access.
 */
export function resolveScreeningGateway(
  records: ScreeningRecordView[] | null | undefined,
  now: Date = new Date(),
): ScreeningGatewayResult {
  const current = pickCurrentScreeningRecord(records ?? [], now);
  if (!current) {
    return {
      displayStatus: DEFAULT_SCREENING_DISPLAY,
      officialOutcome: "not_independently_verified",
      eligibleToWork: null,
      identityLinked: false,
      independentlyVerified: false,
      legalProhibition: false,
      reasonCodes: ["SCREENING_NOT_INDEPENDENTLY_VERIFIED"],
      sourceRefs: [],
    };
  }

  const outcome = current.officialOutcome as OfficialScreeningOutcome;
  const expired =
    Boolean(current.expiresAt) && new Date(current.expiresAt as Date | string) <= now;
  const legalProhibition = NON_OVERRIDABLE_SCREENING_OUTCOMES.has(outcome);
  const independentlyVerified =
    outcome === "clearance" && current.identityLinked && !expired;

  return {
    displayStatus: independentlyVerified
      ? "Current screening status: Clearance (official record, identity linked)"
      : screeningDisplayFor(outcome, expired),
    officialOutcome: expired && outcome === "clearance" ? "no_valid_clearance" : outcome,
    eligibleToWork: current.eligibleToWork,
    identityLinked: current.identityLinked,
    independentlyVerified,
    legalProhibition,
    reasonCodes: screeningReasonCodes(outcome, expired, current.identityLinked),
    sourceRefs: [current.source],
  };
}

export function pickCurrentScreeningRecord(
  records: ScreeningRecordView[],
  now: Date,
): ScreeningRecordView | undefined {
  if (records.length === 0) return undefined;
  const rank = (record: ScreeningRecordView): number => {
    const outcome = record.officialOutcome as OfficialScreeningOutcome;
    const expired =
      Boolean(record.expiresAt) && new Date(record.expiresAt as Date | string) <= now;
    if (NON_OVERRIDABLE_SCREENING_OUTCOMES.has(outcome)) return 5;
    if (outcome === "clearance" && record.identityLinked && !expired) return 4;
    if (outcome === "pending" && !expired) return 3;
    if (outcome === "no_valid_clearance" || expired) return 2;
    return 1;
  };
  return [...records].sort((a, b) => rank(b) - rank(a))[0];
}

function screeningDisplayFor(
  outcome: OfficialScreeningOutcome,
  expired: boolean,
): string {
  if (expired) {
    return "Current screening status: NOT INDEPENDENTLY VERIFIED (record expired)";
  }
  switch (outcome) {
    case "clearance":
      return "Current screening status: Clearance — identity linkage still required for use";
    case "pending":
      return "Current screening status: Pending";
    case "interim_bar":
      return "Current screening status: Interim bar";
    case "exclusion":
      return "Current screening status: Exclusion";
    case "suspension":
      return "Current screening status: Suspension";
    case "no_valid_clearance":
      return "Current screening status: No valid clearance";
    case "not_independently_verified":
      return DEFAULT_SCREENING_DISPLAY;
    default:
      return assertNever(outcome);
  }
}

function screeningReasonCodes(
  outcome: OfficialScreeningOutcome,
  expired: boolean,
  identityLinked: boolean,
): string[] {
  const codes: string[] = [];
  if (expired) codes.push("SCREENING_EXPIRED");
  if (!identityLinked) codes.push("SCREENING_IDENTITY_NOT_LINKED");
  switch (outcome) {
    case "clearance":
      if (!expired && identityLinked) codes.push("SCREENING_OFFICIAL_CLEARANCE");
      else codes.push("SCREENING_NOT_INDEPENDENTLY_VERIFIED");
      break;
    case "pending":
      codes.push("SCREENING_PENDING");
      break;
    case "interim_bar":
      codes.push("SCREENING_INTERIM_BAR");
      break;
    case "exclusion":
      codes.push("SCREENING_EXCLUSION");
      break;
    case "suspension":
      codes.push("SCREENING_SUSPENSION");
      break;
    case "no_valid_clearance":
      codes.push("SCREENING_NO_VALID_CLEARANCE");
      break;
    case "not_independently_verified":
      codes.push("SCREENING_NOT_INDEPENDENTLY_VERIFIED");
      break;
    default:
      return assertNever(outcome);
  }
  return codes;
}

export function cannotOverrideWithApprove(result: ScreeningGatewayResult): boolean {
  return result.legalProhibition;
}
