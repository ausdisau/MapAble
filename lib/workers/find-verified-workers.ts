import { prisma } from "@/lib/prisma";

export type PublicVerifiedWorkerCard = {
  id: string;
  displayName: string;
  place: string;
  transportSummary: string;
  languages: string[];
  verified: true;
};

const TRANSPORT_HINTS = [
  "transport",
  "community_access",
  "community access",
  "wheelchair",
  "travel",
  "driving",
];

function toPublicDisplayName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Support worker";
  if (parts.length === 1) return parts[0]!;
  const last = parts[parts.length - 1]!;
  return `${parts[0]} ${last.charAt(0).toUpperCase()}.`;
}

function transportSummary(serviceTypes: string[]): string {
  const types = serviceTypes.map((t) => t.trim()).filter(Boolean);
  const wheelchair = types.some((t) => /wheelchair/i.test(t));
  const hasTransport = types.some((t) =>
    TRANSPORT_HINTS.some((hint) => t.toLowerCase().includes(hint)),
  );
  if (wheelchair) return "Transport: Car, Wheelchair accessible";
  if (hasTransport || types.length === 0) return "Transport: Car";
  return `Supports: ${types.slice(0, 2).join(", ")}`;
}

function matchesSuburb(regions: string[], query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return regions.some((r) => r.toLowerCase().includes(q));
}

/**
 * Public directory cards for verified workers.
 * Privacy: first name + last initial only; suburb/region labels only.
 */
export async function listPublicVerifiedWorkers(options?: {
  suburbQuery?: string;
  limit?: number;
}): Promise<PublicVerifiedWorkerCard[]> {
  const limit = Math.min(Math.max(options?.limit ?? 24, 1), 48);
  const suburbQuery = options?.suburbQuery?.trim() ?? "";

  const workers = await prisma.workerProfile.findMany({
    where: {
      active: true,
      verificationStatus: "verified",
      workerScreeningStatus: "verified",
    },
    select: {
      id: true,
      displayName: true,
      serviceTypes: true,
      serviceRegions: true,
      languages: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  return workers
    .filter((w) => matchesSuburb(w.serviceRegions, suburbQuery))
    .slice(0, limit)
    .map((w) => ({
      id: w.id,
      displayName: toPublicDisplayName(w.displayName),
      place: w.serviceRegions[0]?.trim() || "Australia",
      transportSummary: transportSummary(w.serviceTypes),
      languages: w.languages.filter(Boolean).slice(0, 4),
      verified: true as const,
    }));
}
