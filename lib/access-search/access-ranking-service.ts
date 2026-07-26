import type { AccessSearchFilters } from "@/lib/access-map/access-filter-service";
import { distanceKm } from "@/lib/map/geo";

const RATING_VALUE_SCORE: Record<string, number> = {
  excellent: 5,
  good: 4,
  basic: 3,
  poor: 2,
  unknown: 0,
  not_applicable: 0,
};

type PlaceRow = {
  id: string;
  name: string;
  category: string;
  suburb: string | null;
  updatedAt: Date;
  confidence: string;
  location: { latitude: number; longitude: number } | null;
  ratingSummaries: { avgScore: number | null; sampleCount: number }[];
  accreditationAssessments: { tier: string | null }[];
  _count: { reviews: number };
};

function avgCommunityScore(place: PlaceRow): number | null {
  const scores = place.ratingSummaries
    .map((s) => s.avgScore)
    .filter((s): s is number => s != null);
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function scorePlace(place: PlaceRow, filters: AccessSearchFilters): number {
  let score = 0;
  const q = filters.q?.trim().toLowerCase();

  if (q && place.name.toLowerCase().includes(q)) score += 40;

  if (filters.lat != null && filters.lng != null && place.location) {
    const dist = distanceKm(
      filters.lat,
      filters.lng,
      place.location.latitude,
      place.location.longitude
    );
    if (filters.radiusKm && dist > filters.radiusKm) return -1;
    score += Math.max(0, 30 - dist);
  }

  const community = avgCommunityScore(place);
  if (community != null) score += community * 4;

  if (place._count.reviews > 0) score += Math.min(place._count.reviews * 2, 20);

  const tier = place.accreditationAssessments[0]?.tier;
  if (tier === "gold") score += 25;
  else if (tier === "silver") score += 18;
  else if (tier === "bronze") score += 10;

  score += place.updatedAt.getTime() / 1e13;

  return score;
}

export function rankAccessPlaces(places: PlaceRow[], filters: AccessSearchFilters) {
  const scored = places
    .map((place) => ({
      place,
      score: scorePlace(place, filters),
      matchReasons: buildMatchReasons(place, filters),
    }))
    .filter((row) => row.score >= 0);

  const sort = filters.sort ?? "relevance";

  scored.sort((a, b) => {
    if (sort === "distance" && filters.lat != null && filters.lng != null) {
      const da = a.place.location
        ? distanceKm(
            filters.lat,
            filters.lng,
            a.place.location.latitude,
            a.place.location.longitude
          )
        : 999;
      const db = b.place.location
        ? distanceKm(
            filters.lat,
            filters.lng,
            b.place.location.latitude,
            b.place.location.longitude
          )
        : 999;
      return da - db;
    }
    if (sort === "most_reviewed") {
      return b.place._count.reviews - a.place._count.reviews;
    }
    if (sort === "recently_updated") {
      return b.place.updatedAt.getTime() - a.place.updatedAt.getTime();
    }
    if (sort === "highest_user_rating") {
      return (avgCommunityScore(b.place) ?? 0) - (avgCommunityScore(a.place) ?? 0);
    }
    if (sort === "accredited_first") {
      const tb = b.place.accreditationAssessments[0]?.tier ? 1 : 0;
      const ta = a.place.accreditationAssessments[0]?.tier ? 1 : 0;
      if (tb !== ta) return tb - ta;
    }
    return b.score - a.score;
  });

  return scored;
}

function buildMatchReasons(place: PlaceRow, filters: AccessSearchFilters): string[] {
  const reasons: string[] = [];
  if (filters.q && place.name.toLowerCase().includes(filters.q.toLowerCase())) {
    reasons.push("Name matches your search");
  }
  if (filters.features?.length) {
    reasons.push("Has selected access features");
  }
  if (place._count.reviews > 0) {
    reasons.push("Community reviewed");
  } else {
    reasons.push("Limited community data — shown as unknown where applicable");
  }
  if (place.accreditationAssessments[0]?.tier) {
    reasons.push("Has published MapAble Accreditation");
  }
  return reasons;
}

export { RATING_VALUE_SCORE };
