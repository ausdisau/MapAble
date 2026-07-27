import { prisma } from "@/lib/prisma";

function remainingCapacity(total: number, booked: number) {
  return Math.max(0, total - booked);
}

export async function readVerifiedProviderCapacity(params: {
  region?: string;
  serviceType?: string;
  days?: number;
  limit?: number;
}) {
  const now = new Date();
  const to = new Date(now.getTime() + Math.min(Math.max(params.days ?? 14, 1), 90) * 86_400_000);
  const organisations = await prisma.organisation.findMany({
    where: {
      status: "active",
      organisationType: "care_provider",
      ...(params.region ? { serviceRegions: { has: params.region } } : {}),
    },
    take: Math.min(Math.max(params.limit ?? 20, 1), 50),
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      serviceRegions: true,
      verificationStatus: true,
      ndisRegistrationClaimed: true,
      insuranceStatus: true,
      workerProfiles: {
        where: { active: true },
        select: { id: true, verificationStatus: true },
      },
      capacityBlocks: {
        where: {
          date: { gte: now, lte: to },
          ...(params.serviceType ? { serviceType: params.serviceType } : {}),
        },
        orderBy: { date: "asc" },
        select: {
          id: true,
          date: true,
          serviceType: true,
          totalCapacity: true,
          bookedCapacity: true,
          notes: true,
        },
      },
      availabilityWindows: {
        where: { active: true, effectiveFrom: { lte: to }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] },
        select: { id: true, dayOfWeek: true, startTime: true, endTime: true, timezone: true },
      },
    },
  });

  return organisations.map((organisation) => ({
    organisationId: organisation.id,
    name: organisation.name,
    serviceRegions: organisation.serviceRegions,
    evidence: {
      organisationVerification: organisation.verificationStatus,
      ndisRegistrationClaim: organisation.ndisRegistrationClaimed,
      insuranceStatus: organisation.insuranceStatus ?? "unknown",
      activeWorkerCount: organisation.workerProfiles.length,
      verifiedWorkerCount: organisation.workerProfiles.filter((worker) => worker.verificationStatus === "verified").length,
      availabilityWindowCount: organisation.availabilityWindows.length,
    },
    capacity: organisation.capacityBlocks.map((block) => ({
      ...block,
      remainingCapacity: remainingCapacity(block.totalCapacity, block.bookedCapacity),
      evidenceSource: "provider_capacity_record",
    })),
    availabilityWindows: organisation.availabilityWindows.map((window) => ({
      ...window,
      evidenceSource: "provider_availability_record",
    })),
    notices: [
      organisation.verificationStatus === "verified"
        ? "MapAble organisation verification is recorded."
        : "The organisation is not recorded as MapAble verified.",
      organisation.ndisRegistrationClaimed
        ? "NDIS registration is provider-claimed and is not treated as independent verification."
        : "No NDIS registration claim is recorded.",
    ],
  }));
}

export async function readVerifiedWorkerCapabilities(params: {
  region?: string;
  serviceType?: string;
  language?: string;
  highIntensityRequired?: boolean;
  limit?: number;
}) {
  const now = new Date();
  const workers = await prisma.workerProfile.findMany({
    where: {
      active: true,
      ...(params.region ? { serviceRegions: { has: params.region } } : {}),
      ...(params.serviceType ? { serviceTypes: { has: params.serviceType } } : {}),
      ...(params.language ? { languages: { has: params.language } } : {}),
      ...(params.highIntensityRequired ? { highIntensityCompetencyVerified: true } : {}),
    },
    take: Math.min(Math.max(params.limit ?? 20, 1), 50),
    orderBy: { displayName: "asc" },
    select: {
      id: true,
      organisationId: true,
      displayName: true,
      profileSummary: true,
      serviceTypes: true,
      serviceRegions: true,
      languages: true,
      communicationCapabilities: true,
      qualificationsSummary: true,
      workerScreeningStatus: true,
      wwccStatus: true,
      firstAidStatus: true,
      insuranceStatus: true,
      verificationStatus: true,
      highIntensityCompetencyVerified: true,
      organisation: { select: { name: true, verificationStatus: true, status: true } },
      trustCredentials: {
        where: { status: "verified", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        select: { credentialType: true, issuerDid: true, expiresAt: true, verificationMethod: true },
      },
      availabilityWindows: {
        where: { active: true, effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] },
        select: { dayOfWeek: true, startTime: true, endTime: true, timezone: true },
      },
    },
  });

  return workers.map((worker) => ({
    workerProfileId: worker.id,
    organisationId: worker.organisationId,
    organisationName: worker.organisation.name,
    displayName: worker.displayName,
    declaredCapabilities: {
      serviceTypes: worker.serviceTypes,
      serviceRegions: worker.serviceRegions,
      languages: worker.languages,
      communicationCapabilities: worker.communicationCapabilities,
      qualificationsSummary: worker.qualificationsSummary,
    },
    recordedChecks: {
      workerProfileVerification: worker.verificationStatus,
      organisationVerification: worker.organisation.verificationStatus,
      workerScreening: worker.workerScreeningStatus,
      workingWithChildren: worker.wwccStatus,
      firstAid: worker.firstAidStatus,
      insurance: worker.insuranceStatus,
      highIntensityCompetencyVerified: worker.highIntensityCompetencyVerified,
    },
    verifiedTrustCredentials: worker.trustCredentials.map((credential) => ({
      ...credential,
      evidenceSource: "verified_trust_credential",
    })),
    availabilityWindows: worker.availabilityWindows.map((window) => ({
      ...window,
      evidenceSource: "worker_availability_record",
    })),
    notices: [
      "Capabilities and preferences are reported separately from verification evidence.",
      "This record is not a recommendation, assignment or guarantee of availability.",
    ],
  }));
}
