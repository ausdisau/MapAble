import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  evaluateOfficialDirectoryPublication,
  validateOfficialDirectoryFilters,
  type OfficialProviderDirectoryFilters,
} from "./official-directory-policy";

/**
 * Reads real public NDIA Provider Finder source rows from the existing
 * NdisProvider ingestion table, only after a reviewed source SHA is approved.
 * Does not use a model, call an NDIA API, or inspect worker / participant PII.
 */
export async function readOfficialProviderDirectoryReadiness() {
  // Fail closed before accessing data when deliberately disabled.
  if (process.env.MAPABLE_NDIS_OFFICIAL_DIRECTORY_READ_ENABLED !== "true") {
    return evaluateOfficialDirectoryPublication(null);
  }
  const latest = await prisma.ndisProviderIngestionRun.findFirst({
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
    select: {
      sourceUrl: true,
      sourceHash: true,
      status: true,
      startedAt: true,
      finishedAt: true,
      providerCount: true,
    },
  });
  return evaluateOfficialDirectoryPublication(latest);
}

export type OfficialDirectoryRecord = {
  sourceRecordId: string;
  organisationName: string;
  abn: string | null;
  registrationNumber: string | null;
  state: string | null;
  suburb: string | null;
  postcode: string | null;
  registrationGroups: string[];
  services: string[];
  sourceAsOf: string | null;
  workerScreening: "not_independently_verified";
  competence: "unknown";
  availability: "unknown";
  accessibility: "unknown";
  currentRegistration: "not_independently_verified";
};

export async function searchApprovedOfficialProviderDirectory(
  filters: OfficialProviderDirectoryFilters,
) {
  const query = validateOfficialDirectoryFilters(filters);
  // Read run and derive the gate first; never serve stale or unapproved data.
  const latest = await prisma.ndisProviderIngestionRun.findFirst({
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
    select: {
      sourceUrl: true,
      sourceHash: true,
      status: true,
      startedAt: true,
      finishedAt: true,
      providerCount: true,
    },
  });
  const gate = evaluateOfficialDirectoryPublication(latest);
  if (!gate.ready || !latest?.finishedAt) {
    return { available: false as const, reason: gate.ready ? "invalid_import" : gate.reason };
  }

  const where: Prisma.NdisProviderWhereInput = {
    sourceUrl: latest.sourceUrl,
    updatedAt: { gte: latest.startedAt, lte: latest.finishedAt },
    providerName: { not: "Unknown provider" },
    ...(query.state ? { state: query.state } : {}),
    ...(query.postcode ? { postcode: query.postcode } : {}),
    ...(query.q ? {
      OR: [
        { providerName: { contains: query.q, mode: "insensitive" } },
        { legalName: { contains: query.q, mode: "insensitive" } },
        { abn: { contains: query.q.replace(/\s+/g, "") } },
        { registrationNumber: { contains: query.q } },
      ],
    } : {}),
  };

  const rows = await prisma.ndisProvider.findMany({
    where,
    select: {
      sourceId: true,
      providerName: true,
      abn: true,
      registrationNumber: true,
      state: true,
      suburb: true,
      postcode: true,
      services: true,
      registrationGroups: true,
      sourceUpdatedAt: true,
    },
    orderBy: [{ providerName: "asc" }, { sourceId: "asc" }],
    skip: (query.page - 1) * query.limit,
    take: query.limit + 1,
  });

  const records: OfficialDirectoryRecord[] = rows.slice(0, query.limit).map(row => ({
    sourceRecordId: row.sourceId,
    organisationName: row.providerName,
    abn: row.abn,
    registrationNumber: row.registrationNumber,
    state: row.state,
    suburb: row.suburb,
    postcode: row.postcode,
    registrationGroups: row.registrationGroups,
    services: row.services,
    sourceAsOf: row.sourceUpdatedAt?.toISOString() ?? null,
    workerScreening: "not_independently_verified",
    competence: "unknown",
    availability: "unknown",
    accessibility: "unknown",
    currentRegistration: "not_independently_verified",
  }));

  return {
    available: true as const,
    source: "official_ndia_provider_finder_import" as const,
    evidence: gate.evidence,
    warning: "These are real directory records from an approved source snapshot, not live NDIS Commission registration or individual worker clearance checks.",
    records,
    page: query.page,
    hasMore: rows.length > query.limit,
    searchIsExhaustive: false as const,
  };
}
