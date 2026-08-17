import type { ProviderOutlet } from "@/data/provider-outlets.types";
import { mapProviderOutletToPrisma } from "@/lib/ndis/map-provider-outlet-prisma";

/** Row shape for `public.provider_outlets` (Supabase / Postgres). */
export type ProviderOutletDbRow = {
  id: string;
  abn: string;
  name: string;
  slug: string | null;
  outlet_key: string | null;
  outlet_name: string | null;
  flag: string | null;
  active: boolean;
  phone: string | null;
  website: string | null;
  email: string | null;
  address: string | null;
  head_office: string | null;
  state: string;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  reg_group: number[];
  opening_hours: string | null;
  professions: string | null;
  raw: Record<string, unknown>;
};

export function mapProviderOutletToDbRow(
  outlet: ProviderOutlet,
  index: number,
): ProviderOutletDbRow {
  const row = mapProviderOutletToPrisma(outlet, index);
  return {
    id: row.id,
    abn: row.abn,
    name: row.name,
    slug: row.slug,
    outlet_key: row.outletKey,
    outlet_name: row.outletName,
    flag: row.flag,
    active: row.active,
    phone: row.phone,
    website: row.website,
    email: row.email,
    address: row.address,
    head_office: row.headOffice,
    state: row.state,
    postcode: row.postcode,
    latitude: row.latitude,
    longitude: row.longitude,
    reg_group: row.regGroup,
    opening_hours: row.openingHours,
    professions: row.professions,
    raw: row.raw as Record<string, unknown>,
  };
}
