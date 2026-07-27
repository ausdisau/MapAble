import type { OrgDirectoryEntry, RegionalOrgAdapter } from "@/lib/platform/federation/contracts";
import { listRegionalOrganisations } from "@/lib/platform/federation/federation-service";

const AU_REGION_CODES = [
  "NSW",
  "VIC",
  "QLD",
  "SA",
  "WA",
  "TAS",
  "NT",
  "ACT",
] as const;

export type AuRegionCode = (typeof AU_REGION_CODES)[number];

export function createRegionalOrgAdapter(regionCode: string): RegionalOrgAdapter {
  return {
    regionCode,
    async resolveOrganisation(directoryRef: string): Promise<OrgDirectoryEntry | null> {
      const { organisations } = await listRegionalOrganisations(regionCode);
      const match = organisations.find((o) => o.directoryRef === directoryRef);
      if (!match) return null;
      return {
        id: match.id,
        regionCode: match.regionCode,
        displayName: match.displayName,
        directoryRef: match.directoryRef ?? undefined,
        organisationId: match.organisationId ?? undefined,
      };
    },
  };
}

export function listSupportedRegions(): readonly string[] {
  return AU_REGION_CODES;
}

export async function resolveOrgAcrossRegions(
  directoryRef: string,
): Promise<OrgDirectoryEntry | null> {
  for (const region of AU_REGION_CODES) {
    const adapter = createRegionalOrgAdapter(region);
    const entry = await adapter.resolveOrganisation(directoryRef);
    if (entry) return entry;
  }
  return null;
}
