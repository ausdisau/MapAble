import type {
  AusPostPacLocality,
  AusPostPostcodeSearchResult,
  AusPostState,
} from "@/types/auspost-pac";

type RawLocality = {
  location?: string;
  state?: string;
  postcode?: string | number;
  category?: string;
};

type RawPostcodeSearchResponse = {
  localities?: {
    locality?: RawLocality | RawLocality[];
  };
};

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeLocality(row: RawLocality): AusPostPacLocality | null {
  const location = row.location?.trim();
  const state = row.state?.trim();
  const postcode = row.postcode != null ? String(row.postcode).trim() : "";
  if (!location || !state || !postcode) return null;
  return {
    location,
    state: state as AusPostState,
    postcode,
    category: row.category,
  };
}

export function normalizePostcodeSearchResponse(
  raw: RawPostcodeSearchResponse,
): AusPostPostcodeSearchResult {
  const rows = asArray(raw.localities?.locality);
  const localities = rows
    .map(normalizeLocality)
    .filter((row): row is AusPostPacLocality => row != null);
  return { localities };
}
