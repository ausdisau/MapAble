import { careosOpportunitiesConfig } from "@/lib/config/careos-opportunities";

/**
 * NDIS Commission digital-platform rule pack (official page updated 8 Sep 2026).
 *
 * An NDIS digital platform is an intermediary whose **main purpose** is
 * connecting NDIS plan supports **and** processing NDIS payments. Registration
 * group **0137** applies from **1 July 2026** (not assumed 1 January 2027).
 *
 * MapAble's current finder and care surfaces do **not** automatically meet
 * that definition. Applicability is **unverified pending counsel**.
 *
 * This module is default-off behind MAPABLE_CAREOS_PLATFORM_REGISTRATION_ENABLED.
 * It must not apply clearance-before-offer rules to every worker.
 */
export const PLATFORM_0137_SOURCE =
  "NDIS Commission — Digital platforms (updated 8 September 2026)";

export const PLATFORM_0137_REGISTRATION_FROM = "2026-07-01";

export type Platform0137Evaluation = {
  applied: boolean;
  applicable: boolean;
  reason: string;
  clearanceBeforeOffer: boolean;
  counselPending: boolean;
};

export function isPlatform0137RulePackEnabled(): boolean {
  return careosOpportunitiesConfig.platformRegistrationEnabled;
}

export function evaluatePlatform0137Rules(input?: {
  connectingNdisPlanSupports?: boolean;
  processingNdisPayments?: boolean;
}): Platform0137Evaluation {
  if (!isPlatform0137RulePackEnabled()) {
    return {
      applied: false,
      applicable: false,
      reason: "0137_RULE_PACK_DEFAULT_OFF",
      clearanceBeforeOffer: false,
      counselPending: true,
    };
  }

  const mainPurpose =
    Boolean(input?.connectingNdisPlanSupports) &&
    Boolean(input?.processingNdisPayments);

  if (!mainPurpose) {
    return {
      applied: false,
      applicable: false,
      reason: "0137_DEFINITION_NOT_MET_BY_FINDER_OR_CARE_SURFACES",
      clearanceBeforeOffer: false,
      counselPending: true,
    };
  }

  return {
    applied: false,
    applicable: false,
    reason: "0137_APPLICABILITY_UNVERIFIED_PENDING_COUNSEL",
    clearanceBeforeOffer: false,
    counselPending: true,
  };
}
