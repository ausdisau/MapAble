import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type NdisProviderSearchParams = {
  q?: string;
  state?: string;
  postcode?: string;
  service?: string;
  limit?: number;
  /** When true, only rows with non-null, non-zero latitude/longitude (map pins). */
  withCoordinatesOnly?: boolean;
};

export type NdisProviderSearchRow = {
  source_id: string;
  provider_name: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  services: string[];
  registration_groups: string[];
  updated_at: Date;
};

export async function searchNdisProviders(
  params: NdisProviderSearchParams,
): Promise<{ providers: NdisProviderSearchRow[]; count: number }> {
  const limit = Math.min(Math.max(params.limit ?? 25, 1), 100);
  const q = params.q?.trim() || null;
  const state = params.state?.trim().toUpperCase() || null;
  const postcode = params.postcode?.trim() || null;
  const service = params.service?.trim() || null;

  const conditions: Prisma.Sql[] = [Prisma.sql`TRUE`];

  if (params.withCoordinatesOnly) {
    conditions.push(
      Prisma.sql`latitude IS NOT NULL`,
      Prisma.sql`longitude IS NOT NULL`,
      Prisma.sql`latitude <> 0`,
      Prisma.sql`longitude <> 0`,
    );
  }

  if (q) {
    conditions.push(
      Prisma.sql`to_tsvector('english', provider_name) @@ plainto_tsquery('english', ${q})`,
    );
  }
  if (state) {
    conditions.push(Prisma.sql`state = ${state}`);
  }
  if (postcode) {
    conditions.push(Prisma.sql`postcode = ${postcode}`);
  }
  if (service) {
    conditions.push(Prisma.sql`${service} = ANY(services)`);
  }

  const whereClause = Prisma.join(conditions, " AND ");

  const rows = await prisma.$queryRaw<NdisProviderSearchRow[]>`
    SELECT
      source_id,
      provider_name,
      suburb,
      state,
      postcode,
      latitude,
      longitude,
      phone,
      email,
      website,
      services,
      registration_groups,
      updated_at
    FROM ndis_providers
    WHERE ${whereClause}
    ORDER BY provider_name ASC
    LIMIT ${limit}
  `;

  return { providers: rows, count: rows.length };
}
