import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  readableWebsite,
  type ProviderCandidate,
  type ProviderDiscovery,
} from "./core";

/**
 * Candidate discovery only. Never infer verified registration, worker
 * qualifications, current availability or geographic service coverage.
 * The app's existing Prisma DATABASE_URL must point to an authorised Neon
 * database; never query a separate Neon project with shared credentials.
 */
export async function discoverSupportBuilderProviders(input: {
  locality: string;
  query: string;
  limit?: number;
}): Promise<ProviderDiscovery> {
  const locality = input.locality.trim().slice(0, 100);
  const query = input.query.trim().slice(0, 100);
  const limit = Math.max(1, Math.min(input.limit ?? 12, 20));
  if (!locality && !query) {
    return {
      providers: [],
      sourcesChecked: [],
      coverageNote: "Enter a locality or a provider/service search term to begin.",
    };
  }

  const postcode = locality.match(/\b\d{4}\b/)?.[0];
  const state = locality.match(/\b(NSW|VIC|QLD|SA|WA|TAS|ACT|NT)\b/i)?.[1]?.toUpperCase();
  const suburb = locality
    .replace(/\b\d{4}\b/g, "")
    .replace(/\b(NSW|VIC|QLD|SA|WA|TAS|ACT|NT)\b/gi, "")
    .replace(/,/g, " ")
    .trim();

  const importedConditions: Prisma.NdisProviderWhereInput[] = [];
  if (query) {
    importedConditions.push({
      OR: [
        { providerName: { contains: query, mode: "insensitive" } },
        { services: { has: query } },
      ],
    });
  }
  if (locality) {
    const alternatives: Prisma.NdisProviderWhereInput[] = [];
    if (postcode) alternatives.push({ postcode });
    if (suburb) alternatives.push({ suburb: { contains: suburb, mode: "insensitive" } });
    if (!postcode && !suburb && state) alternatives.push({ state });
    if (alternatives.length) importedConditions.push({ OR: alternatives });
  }

  const sourcesChecked: string[] = [];
  const candidates: ProviderCandidate[] = [];
  try {
    const imported = await prisma.ndisProvider.findMany({
      where: { AND: importedConditions },
      select: {
        sourceId: true,
        providerName: true,
        suburb: true,
        state: true,
        postcode: true,
        services: true,
        registrationGroups: true,
        website: true,
        sourceUrl: true,
        updatedAt: true,
      },
      take: limit,
      orderBy: { providerName: "asc" },
    });
    sourcesChecked.push("MapAble NDIS provider importer");
    for (const row of imported) {
      candidates.push({
        id: "ndis:" + row.sourceId,
        name: row.providerName,
        locationLabel: [row.suburb, row.state, row.postcode].filter(Boolean).join(" ") || "Location not supplied",
        serviceSignals: row.services.slice(0, 5),
        website: readableWebsite(row.website),
        sourceLabel: "MapAble imported provider record",
        sourceUrl: readableWebsite(row.sourceUrl),
        lastRecordedAt: row.updatedAt.toISOString(),
        registrationRecorded: row.registrationGroups.length ? true : null,
        registrationNote: row.registrationGroups.length
          ? "Registration groups recorded in imported data; current status not verified"
          : "Current NDIS registration not confirmed",
        verificationStatus: "unverified",
      });
    }
  } catch {
    // Older Neon projects may not yet have the ndis_providers table.
    // Continue to the existing Provider table without masking coverage limits.
    sourcesChecked.push("NDIS importer unavailable on configured database");
  }

  if (candidates.length < limit) {
    const legacyConditions: Prisma.ProviderWhereInput[] = [];
    if (query) {
      legacyConditions.push({
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      });
    }
    if (locality) {
      const locationOptions: Prisma.ProviderWhereInput[] = [];
      if (postcode) {
        locationOptions.push({ locations: { some: { postcode } } });
      }
      if (suburb) {
        locationOptions.push({
          locations: { some: { city: { contains: suburb, mode: "insensitive" } } },
        });
        locationOptions.push({ serviceAreas: { has: suburb } });
      }
      if (!postcode && !suburb && state) {
        locationOptions.push({ locations: { some: { state } } });
      }
      if (locationOptions.length) legacyConditions.push({ OR: locationOptions });
    }
    try {
      const legacy = await prisma.provider.findMany({
        where: { AND: legacyConditions },
        select: {
          id: true,
          name: true,
          description: true,
          website: true,
          ndisRegistered: true,
          serviceAreas: true,
          specialisations: true,
          locations: { select: { city: true, state: true, postcode: true } },
          updatedAt: true,
        },
        take: limit - candidates.length,
        orderBy: { name: "asc" },
      });
      sourcesChecked.push("MapAble Provider table");
      for (const row of legacy) {
        const location = row.locations[0];
        candidates.push({
          id: "provider:" + row.id,
          name: row.name,
          locationLabel:
            [location?.city, location?.state, location?.postcode]
              .filter(Boolean).join(" ") || "Office location not supplied",
          serviceSignals: [...row.serviceAreas, ...row.specialisations].slice(0, 5),
          website: readableWebsite(row.website),
          sourceLabel: "MapAble provider record; external source not established",
          sourceUrl: null,
          lastRecordedAt: row.updatedAt.toISOString(),
          registrationRecorded: row.ndisRegistered ? true : null,
          registrationNote: row.ndisRegistered
            ? "Registration indicated by directory record; verify with NDIS Commission"
            : "Current NDIS registration not confirmed",
          verificationStatus: "unverified",
        });
      }
    } catch {
      sourcesChecked.push("MapAble Provider table unavailable");
    }
  }

  return {
    providers: candidates,
    sourcesChecked,
    coverageNote: candidates.length
      ? "These are directory leads, not confirmed matches. Office location is not proof of service coverage. Independently check service suitability, worker qualifications, registration and availability."
      : "No records matched in the connected data. This does not mean suitable providers do not exist locally; expand the search or consult official provider directories.",
  };
}
