export type MapAblePlaceConfidence =
  | 'unknown'
  | 'user_reported'
  | 'multiple_user_reports'
  | 'venue_claimed'
  | 'mapable_verified'
  | 'mapable_accredited';

export type MapAblePlace = {
  id: string;
  name: string;
  category: string;
  suburb?: string | null;
  confidence: MapAblePlaceConfidence;
  latitude?: number | null;
  longitude?: number | null;
  reviewCount: number;
  accreditationTier?: string | null;
};

export type MapAblePlaceSearchResult = {
  place: MapAblePlace;
  matchReasons: string[];
};

type MapAblePlaceSearchResponse = {
  results: MapAblePlaceSearchResult[];
};

const confidenceValues = new Set<MapAblePlaceConfidence>([
  'unknown',
  'user_reported',
  'multiple_user_reports',
  'venue_claimed',
  'mapable_verified',
  'mapable_accredited',
]);

export class MapAbleApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MapAbleApiError';
  }
}

function getConfiguredBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_MAPABLE_API_URL ?? '').trim().replace(/\/+$/, '');
}

export function isMapAbleApiConfigured(): boolean {
  return getConfiguredBaseUrl().length > 0;
}

function isNullableString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === 'string';
}

function isNullableNumber(value: unknown): value is number | null | undefined {
  return value === undefined || value === null || (typeof value === 'number' && Number.isFinite(value));
}

function isPlace(value: unknown): value is MapAblePlace {
  if (!value || typeof value !== 'object') return false;
  const place = value as Record<string, unknown>;

  return (
    typeof place.id === 'string' &&
    typeof place.name === 'string' &&
    typeof place.category === 'string' &&
    typeof place.confidence === 'string' &&
    confidenceValues.has(place.confidence as MapAblePlaceConfidence) &&
    typeof place.reviewCount === 'number' &&
    Number.isFinite(place.reviewCount) &&
    isNullableString(place.suburb) &&
    isNullableNumber(place.latitude) &&
    isNullableNumber(place.longitude) &&
    isNullableString(place.accreditationTier)
  );
}

function isSearchResult(value: unknown): value is MapAblePlaceSearchResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Record<string, unknown>;

  return (
    isPlace(result.place) &&
    Array.isArray(result.matchReasons) &&
    result.matchReasons.every((reason) => typeof reason === 'string')
  );
}

function isSearchResponse(value: unknown): value is MapAblePlaceSearchResponse {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { results?: unknown };
  return Array.isArray(candidate.results) && candidate.results.every(isSearchResult);
}

export async function searchMapAblePlaces(query: string): Promise<MapAblePlaceSearchResult[]> {
  const baseUrl = getConfiguredBaseUrl();
  if (!baseUrl) {
    throw new MapAbleApiError('MapAble platform connection is not configured.');
  }

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    throw new MapAbleApiError('Enter a place, suburb or category to search.');
  }

  // This initial native integration intentionally sends only the user's typed
  // query. It does not request or transmit live device location.
  const endpoint = `${baseUrl}/api/access/search?q=${encodeURIComponent(trimmedQuery)}&limit=5&sort=relevance`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new MapAbleApiError('MapAble returned an unreadable response.');
  }

  if (!response.ok) {
    const serverMessage =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `MapAble search failed with status ${response.status}.`;
    throw new MapAbleApiError(serverMessage);
  }

  if (!isSearchResponse(payload)) {
    throw new MapAbleApiError('MapAble returned an unexpected search response.');
  }

  return payload.results;
}
