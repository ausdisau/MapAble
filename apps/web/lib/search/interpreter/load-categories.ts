import { prisma } from "@/lib/prisma";

export type ServiceCategoryRow = {
  id: string;
  slug: string;
  name: string;
  keywords: string[];
};

let cache: { rows: ServiceCategoryRow[]; loadedAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

export async function listServiceCategories(): Promise<ServiceCategoryRow[]> {
  const now = Date.now();
  if (cache && now - cache.loadedAt < CACHE_TTL_MS) {
    return cache.rows;
  }

  try {
    const rows = await prisma.serviceCategory.findMany({
      orderBy: { name: "asc" },
    });
    const mapped = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      keywords: r.keywords ?? [],
    }));
    cache = { rows: mapped, loadedAt: now };
    return mapped;
  } catch (err) {
    console.error("[search-interpreter] failed to load service categories", err);
    return getStaticFallbackCategories();
  }
}

export function clearServiceCategoryCache(): void {
  cache = null;
}

/** Matches prisma/seed-search-autocomplete.ts when DB unavailable in tests. */
export function getStaticFallbackCategories(): ServiceCategoryRow[] {
  return [
    {
      id: "static-personal-care",
      slug: "personal-care",
      name: "Personal care",
      keywords: ["personal", "care", "daily", "support worker"],
    },
    {
      id: "static-accessible-transport",
      slug: "accessible-transport",
      name: "Accessible transport",
      keywords: ["transport", "wheelchair", "taxi", "ride"],
    },
    {
      id: "static-occupational-therapy",
      slug: "occupational-therapy",
      name: "Occupational therapy",
      keywords: ["ot", "occupational", "assessment"],
    },
    {
      id: "static-physiotherapy",
      slug: "physiotherapy",
      name: "Physiotherapy",
      keywords: ["physio", "physical"],
    },
    {
      id: "static-support-coordination",
      slug: "support-coordination",
      name: "Support coordination",
      keywords: ["coordination", "sc"],
    },
  ];
}
