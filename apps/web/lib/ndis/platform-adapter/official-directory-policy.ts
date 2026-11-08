/**
 * Real public NDIA Provider Finder snapshot: deterministic publication gate.
 *
 * This is NOT a provider registration verification, worker screening service
 * or an NDIA digital-partner API. It reads already ingested public data only.
 */
export const OFFICIAL_NDIS_PROVIDER_FINDER_SOURCES = [
  "https://www.ndis.gov.au/sites/default/files/react_extract/provider_finder/build/data/list-providers.json",
  "https://ndis.gov.au/sites/default/files/react_extract/provider_finder/build/data/list-providers.json",
] as const;

export const OFFICIAL_DIRECTORY_MAX_IMPORT_AGE_DAYS = 14;

export type OfficialDirectoryEnv = {
  MAPABLE_NDIS_OFFICIAL_DIRECTORY_READ_ENABLED?: string;
  MAPABLE_NDIS_APPROVED_SOURCE_SHA256?: string;
};

export type IngestionEvidence = {
  sourceUrl: string;
  sourceHash: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  providerCount: number;
};

export type DirectoryGate =
  | { ready: false; reason:
      "disabled" | "no_successful_import" | "untrusted_source" |
      "unapproved_hash" | "invalid_import" | "stale_import" }
  | { ready: true; evidence: {
      officialSourceUrl: string;
      snapshotSha256: string;
      retrievedAt: string;
      providerCountInImport: number;
      verifiedCurrentRegistration: false;
      verifiedWorkerScreening: false;
    } };

export function evaluateOfficialDirectoryPublication(
  run: IngestionEvidence | null,
  env: OfficialDirectoryEnv = process.env,
  now: Date = new Date(),
): DirectoryGate {
  if (env.MAPABLE_NDIS_OFFICIAL_DIRECTORY_READ_ENABLED !== "true") {
    return { ready: false, reason: "disabled" };
  }
  if (!run || run.status !== "success") {
    return { ready: false, reason: "no_successful_import" };
  }
  if (!OFFICIAL_NDIS_PROVIDER_FINDER_SOURCES.includes(
    run.sourceUrl as (typeof OFFICIAL_NDIS_PROVIDER_FINDER_SOURCES)[number],
  )) {
    return { ready: false, reason: "untrusted_source" };
  }
  const approvedHash = env.MAPABLE_NDIS_APPROVED_SOURCE_SHA256?.toLowerCase() ?? "";
  if (!/^[a-f0-9]{64}$/.test(approvedHash) ||
      !/^[a-f0-9]{64}$/.test(run.sourceHash) ||
      run.sourceHash.toLowerCase() !== approvedHash) {
    return { ready: false, reason: "unapproved_hash" };
  }
  if (!run.finishedAt || !Number.isInteger(run.providerCount) ||
      run.providerCount < 1 ||
      run.finishedAt.getTime() < run.startedAt.getTime()) {
    return { ready: false, reason: "invalid_import" };
  }
  const ageMs = now.getTime() - run.finishedAt.getTime();
  if (!Number.isFinite(ageMs) || ageMs < -60_000 ||
      ageMs > OFFICIAL_DIRECTORY_MAX_IMPORT_AGE_DAYS * 86_400_000) {
    return { ready: false, reason: "stale_import" };
  }
  return {
    ready: true,
    evidence: {
      officialSourceUrl: run.sourceUrl,
      snapshotSha256: run.sourceHash,
      retrievedAt: run.finishedAt.toISOString(),
      providerCountInImport: run.providerCount,
      verifiedCurrentRegistration: false,
      verifiedWorkerScreening: false,
    },
  };
}

export type OfficialProviderDirectoryFilters = {
  q?: string;
  state?: "NSW" | "VIC" | "QLD" | "SA" | "WA" | "TAS" | "ACT" | "NT";
  postcode?: string;
  page?: number;
  limit?: number;
};

export function validateOfficialDirectoryFilters(filters: OfficialProviderDirectoryFilters) {
  const q = filters.q?.trim() ?? "";
  const state = filters.state ?? "";
  const postcode = filters.postcode?.trim() ?? "";
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 15;
  if (
    q.length > 80 || (q && q.length < 2) ||
    (state && !["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"].includes(state)) ||
    (postcode && !/^\d{4}$/.test(postcode)) ||
    !Number.isSafeInteger(page) || page < 1 || page > 20 ||
    !Number.isSafeInteger(limit) || limit < 1 || limit > 20 ||
    !(q || state || postcode)
  ) {
    throw new Error("INVALID_OFFICIAL_PROVIDER_FILTERS");
  }
  return { q, state, postcode, page, limit };
}
