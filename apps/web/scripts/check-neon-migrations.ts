import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();
  try {
    const tables = await p.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `;
    console.log("public table count:", tables.length);

    const check = [
      "IncidentReport",
      "transport_trips",
      "SupportTicket",
      "cases",
      "User",
      "Booking",
    ];
    for (const t of check) {
      const found = tables.some((r) => r.tablename === t);
      console.log(`${t}:`, found ? "YES" : "NO");
    }

    const migCount = await p.$queryRaw<{ c: number }[]>`
      SELECT COUNT(*)::int as c FROM _prisma_migrations
    `;
    console.log("_prisma_migrations rows:", migCount[0]?.c);

    const stats = await p.$queryRaw<
      { total: number; success: number; unfinished: number; rolled: number }[]
    >`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)::int AS success,
        COUNT(*) FILTER (WHERE finished_at IS NULL)::int AS unfinished,
        COUNT(*) FILTER (WHERE rolled_back_at IS NOT NULL)::int AS rolled
      FROM _prisma_migrations
    `;
    console.log("migration stats:", stats[0]);

    const inDb = await p.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM _prisma_migrations
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
      ORDER BY migration_name
    `;
    const dbNames = new Set(inDb.map((r) => r.migration_name));

    const fs = await import("node:fs");
    const path = await import("node:path");
    const migDir = path.join(process.cwd(), "prisma/migrations");
    const repoMigs = fs
      .readdirSync(migDir)
      .filter((d) => fs.statSync(path.join(migDir, d)).isDirectory())
      .sort();

    const missingInDb = repoMigs.filter((m) => !dbNames.has(m));
    const extraInDb = [...dbNames].filter((m) => !repoMigs.includes(m));

    console.log("\nRepo migrations:", repoMigs.length);
    console.log("Applied in DB (finished, not rolled):", dbNames.size);
    console.log("Repo migrations NOT recorded as applied:", missingInDb.length);
    if (missingInDb.length <= 15) {
      console.log(missingInDb.join("\n"));
    } else {
      console.log(missingInDb.slice(0, 10).join("\n"), "...");
    }
    console.log("DB migrations not in repo folder:", extraInDb.length);
    if (extraInDb.length) console.log(extraInDb.slice(0, 15).join("\n"));

    const falseApplied = [
      "20260525000000_mapable_access_phase_1",
      "20260527120000_transport_scheduling_routing",
      "20260607000000_case_management",
    ];
    for (const m of falseApplied) {
      const applied = dbNames.has(m);
      console.log(`\n${m} marked applied:`, applied);
    }
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
