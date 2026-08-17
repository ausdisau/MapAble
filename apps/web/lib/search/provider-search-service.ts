import { prisma } from "@/lib/prisma";

export type ProviderSearchFilters = {
  serviceRegion?: string;
  serviceType?: string;
  wheelchairAccessible?: boolean;
  verificationStatus?: string;
  language?: string;
  organisationType?: string;
};

export async function searchCareProviders(filters: ProviderSearchFilters) {
  const orgs = await prisma.organisation.findMany({
    where: {
      organisationType: "care_provider",
      status: "active",
      ...(filters.verificationStatus
        ? { verificationStatus: filters.verificationStatus as never }
        : {}),
      ...(filters.serviceRegion
        ? { serviceRegions: { has: filters.serviceRegion } }
        : {}),
    },
    take: 50,
    orderBy: { name: "asc" },
  });

  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    organisationType: o.organisationType,
    verificationStatus: o.verificationStatus,
    verificationCaution:
      o.verificationStatus !== "verified"
        ? "This provider is not fully verified. Details require review."
        : null,
    serviceRegions: o.serviceRegions,
    // Never expose private credential documents
  }));
}

export async function searchTransportOperators(filters: ProviderSearchFilters) {
  const orgs = await prisma.organisation.findMany({
    where: {
      organisationType: "transport_provider",
      status: "active",
    },
    take: 50,
  });

  const vehicles = filters.wheelchairAccessible
    ? await prisma.vehicle.findMany({
        where: { wheelchairAccessible: true, active: true },
        select: { organisationId: true },
      })
    : [];

  const orgIdsWithWav = new Set(vehicles.map((v) => v.organisationId));

  return orgs
    .filter(
      (o) =>
        !filters.wheelchairAccessible || orgIdsWithWav.has(o.id)
    )
    .map((o) => ({
      id: o.id,
      name: o.name,
      verificationStatus: o.verificationStatus,
      verificationCaution:
        o.verificationStatus !== "verified"
          ? "Verification pending — confirm suitability before booking."
          : null,
    }));
}

export async function searchWorkersPublic(filters: ProviderSearchFilters) {
  return prisma.workerProfile.findMany({
    where: {
      active: true,
      ...(filters.serviceType
        ? { serviceTypes: { has: filters.serviceType } }
        : {}),
      ...(filters.language ? { languages: { has: filters.language } } : {}),
    },
    select: {
      id: true,
      displayName: true,
      serviceTypes: true,
      serviceRegions: true,
      languages: true,
      verificationStatus: true,
      profileSummary: true,
    },
    take: 50,
  });
}
