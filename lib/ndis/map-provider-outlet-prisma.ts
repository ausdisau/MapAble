import type { Prisma } from "@prisma/client";

import { mapOutletToProvider } from "@/app/provider-finder/outletToProvider";
import type { ProviderOutlet } from "@/data/provider-outlets.types";

export type ProviderOutletPrismaInput = {
  id: string;
  abn: string;
  name: string;
  slug: string | null;
  outletKey: string | null;
  outletName: string | null;
  flag: string | null;
  active: boolean;
  phone: string | null;
  website: string | null;
  email: string | null;
  address: string | null;
  headOffice: string | null;
  state: string;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  regGroup: number[];
  openingHours: string | null;
  professions: string | null;
  raw: Prisma.InputJsonValue;
};

export function mapProviderOutletToPrisma(
  outlet: ProviderOutlet,
  index: number,
): ProviderOutletPrismaInput {
  const mapped = mapOutletToProvider(outlet, index);
  const name = (outlet.Prov_N?.trim() || outlet.Outletname?.trim() || "Unknown").trim();

  return {
    id: mapped.id,
    abn: outlet.ABN?.trim() || "",
    name,
    slug: mapped.slug || null,
    outletKey: mapped.outletKey ?? null,
    outletName: outlet.Outletname?.trim() || null,
    flag: outlet.Flag ?? null,
    active: outlet.Active === 1,
    phone: outlet.Phone?.trim() || null,
    website: outlet.Website?.trim() || null,
    email: outlet.Email?.trim() || null,
    address: outlet.Address?.trim() || null,
    headOffice: outlet.Head_Office?.trim() || null,
    state: mapped.state || outlet.State_cd,
    postcode: mapped.postcode || String(outlet.Post_cd) || null,
    latitude: outlet.Latitude !== 0 ? outlet.Latitude : null,
    longitude: outlet.Longitude !== 0 ? outlet.Longitude : null,
    regGroup: Array.isArray(outlet.RegGroup) ? outlet.RegGroup : [],
    openingHours: outlet.opnhrs?.trim() || null,
    professions: outlet.prfsn?.trim() || null,
    raw: outlet as unknown as Prisma.InputJsonValue,
  };
}
