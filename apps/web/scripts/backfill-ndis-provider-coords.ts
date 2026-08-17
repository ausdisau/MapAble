/**
 * Backfill ndis_providers.latitude/longitude from suburb + postcode via geocoding-service.
 *
 * Usage: npx tsx scripts/backfill-ndis-provider-coords.ts [--limit=100] [--dry-run]
 */
import { geocodeSuburbPostcode } from "@/lib/map/geocoding-service";
import { prisma } from "@/lib/prisma";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 200;

  process.env.MAP_GEOCODING_NOMINATIM_ENABLED = "true";

  const rows = await prisma.$queryRaw<
    Array<{
      source_id: string;
      suburb: string | null;
      state: string | null;
      postcode: string | null;
    }>
  >`
    SELECT source_id, suburb, state, postcode
    FROM ndis_providers
    WHERE (latitude IS NULL OR longitude IS NULL OR latitude = 0 OR longitude = 0)
      AND (suburb IS NOT NULL OR postcode IS NOT NULL)
    LIMIT ${limit}
  `;

  let updated = 0;
  for (const row of rows) {
    const coords = await geocodeSuburbPostcode(
      row.suburb ?? undefined,
      row.postcode ?? undefined,
      row.state ?? undefined,
    );
    if (!coords) continue;

    if (!dryRun) {
      await prisma.$executeRaw`
        UPDATE ndis_providers
        SET latitude = ${coords.lat}, longitude = ${coords.lng}, updated_at = NOW()
        WHERE source_id = ${row.source_id}
      `;
    }
    updated += 1;
    await new Promise((r) => setTimeout(r, 1100));
  }

  console.log(
    dryRun
      ? `[dry-run] Would update ${updated} of ${rows.length} candidates`
      : `Updated ${updated} of ${rows.length} candidates`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
