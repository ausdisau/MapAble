/**
 * Read-only published NDIA snapshot facade for future Provider Finder/Marketplace.
 * Never reads failed/staging runs. Never exposes raw or implies registration.
 */
import { prisma } from "@/lib/prisma";
import { PUBLICATION_CODE } from "@/lib/ingestion/ndis-outlet-import-service";

export type PublishedOutletFilter = {
  readonly name?: string;
  readonly state?: string;
  readonly postcode?: string;
  readonly registrationGroup?: string;
  readonly limit?: number;
};
export type PublishedDirectoryResult = {
  readonly source: "ndia_provider_finder_published_snapshot";
  readonly sourceDate: string | null;
  readonly snapshotHash: string;
  readonly publishedAt: string;
  readonly totalReturned: number;
  readonly countIsExhaustive: false;
  readonly registration: "NOT_INDEPENDENTLY_VERIFIED";
  readonly workerScreening: "NOT_INDEPENDENTLY_VERIFIED";
  readonly serviceAvailability: "NOT_VERIFIED";
  readonly listings: readonly {
    readonly organisationName: string;
    readonly organisationAbn: string | null;
    readonly identityBasis: string;
    readonly outletName: string;
    readonly outletId: string;
    readonly state: string | null;
    readonly postcode: string | null;
    readonly suburb: string | null;
    readonly registrationGroups: readonly string[];
    readonly professions: readonly string[];
    readonly directoryActiveFlag: boolean | null;
  }[];
};
export async function searchPublishedNdisDirectory(
  params: PublishedOutletFilter,
): Promise<PublishedDirectoryResult | null> {
  const name = params.name?.trim() ?? "";
  const state = params.state?.trim().toUpperCase() ?? "";
  const postcode = params.postcode?.trim() ?? "";
  const registrationGroup = params.registrationGroup?.trim() ?? "";
  const limit = params.limit ?? 15;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 25 ||
      name.length > 80 || (name.length > 0 && name.length < 2) ||
      (state && !["NSW","VIC","QLD","SA","WA","TAS","ACT","NT"].includes(state)) ||
      (postcode && !/^\d{4}$/.test(postcode)) ||
      registrationGroup.length > 160 || !(name || state || postcode || registrationGroup)) {
    throw new Error("PUBLISHED_DIRECTORY_FILTERS_INVALID");
  }
  const pointer = await prisma.ndisDirectoryPublication.findUnique({
    where: { code: PUBLICATION_CODE },
    include: { run: { select: {
      id: true, status: true, sourceDate: true, sourceSha256: true,
    } } },
  });
  if (!pointer || pointer.run.status !== "staged") return null;
  const matches = await prisma.ndisDirectoryOutlet.findMany({
    where: {
      runId: pointer.runId,
      ...(state ? { state } : {}),
      ...(postcode ? { postcode } : {}),
      ...(registrationGroup ? { registrationGroups: { has: registrationGroup } } : {}),
      ...(name ? { OR: [
        { outletName: { contains: name, mode: "insensitive" as const } },
        { organisation: { is: { name: { contains: name, mode: "insensitive" as const } } } },
      ] } : {}),
    },
    select: {
      outletKey: true, outletName: true, state: true, postcode: true,
      suburb: true, registrationGroups: true, professions: true,
      sourceActiveFlag: true,
      organisation: { select: { name: true, abn: true, identityBasis: true } },
    },
    orderBy: [{ outletName: "asc" }, { outletKey: "asc" }],
    take: limit,
  });
  return {
    source: "ndia_provider_finder_published_snapshot",
    sourceDate: pointer.run.sourceDate,
    snapshotHash: pointer.run.sourceSha256,
    publishedAt: pointer.publishedAt.toISOString(),
    totalReturned: matches.length,
    countIsExhaustive: false,
    registration: "NOT_INDEPENDENTLY_VERIFIED",
    workerScreening: "NOT_INDEPENDENTLY_VERIFIED",
    serviceAvailability: "NOT_VERIFIED",
    listings: matches.map((o) => ({
      organisationName: o.organisation.name,
      organisationAbn: o.organisation.abn,
      identityBasis: o.organisation.identityBasis,
      outletName: o.outletName,
      outletId: o.outletKey,
      state: o.state, postcode: o.postcode, suburb: o.suburb,
      registrationGroups: o.registrationGroups, professions: o.professions,
      directoryActiveFlag: o.sourceActiveFlag,
    })),
  };
}
