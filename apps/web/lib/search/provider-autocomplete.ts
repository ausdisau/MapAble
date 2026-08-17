import { prisma } from "@/lib/prisma";
import type { AutocompleteSuggestion } from "@/types/search";

/** Directory profiles visible in search; verified providers sort first. */
export async function searchProviders(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const rows = await prisma.providerProfile.findMany({
      where: {
        isSearchVisible: true,
        name: { contains: q, mode: "insensitive" },
      },
      take: limit,
      orderBy: [{ isVerified: "desc" }, { name: "asc" }],
    });

    return rows.map((row) => ({
      id: `provider-${row.id}`,
      type: "provider",
      typeLabel: row.isVerified ? "Provider" : "Provider (unverified)",
      label: row.name,
      description: [row.suburb, row.state].filter(Boolean).join(", ") || undefined,
      value: row.name,
      metadata: {
        slug: row.slug ?? undefined,
        suburb: row.suburb ?? undefined,
        state: row.state ?? undefined,
        postcode: row.postcode ?? undefined,
        providerId: row.legacyProviderId ?? undefined,
      },
    }));
  } catch (err) {
    console.error("[predictive-suggestions] provider search failed", err);
    throw err;
  }
}

/** Top visible providers for proactive suggestions (no query). */
export async function listProactiveProviders(
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  try {
    const rows = await prisma.providerProfile.findMany({
      where: { isSearchVisible: true },
      take: limit,
      orderBy: [{ isVerified: "desc" }, { name: "asc" }],
    });

    return rows.map((row) => ({
      id: `provider-${row.id}`,
      type: "provider",
      typeLabel: row.isVerified ? "Provider" : "Provider (unverified)",
      label: row.name,
      description: [row.suburb, row.state].filter(Boolean).join(", ") || undefined,
      value: row.name,
      metadata: {
        slug: row.slug ?? undefined,
        suburb: row.suburb ?? undefined,
        state: row.state ?? undefined,
        postcode: row.postcode ?? undefined,
        providerId: row.legacyProviderId ?? undefined,
      },
    }));
  } catch (err) {
    console.error("[predictive-suggestions] proactive providers failed", err);
    throw err;
  }
}
