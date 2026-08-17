import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { ProviderOutlet } from "@/data/provider-outlets.types";

/** Official NDIS provider finder static export (may return 403 outside a browser). */
export const NDIS_LIST_PROVIDERS_URL =
  "https://ndis.gov.au/sites/default/files/react_extract/provider_finder/build/data/list-providers.json";

export const NDIS_LIST_PROVIDERS_URL_WWW =
  "https://www.ndis.gov.au/sites/default/files/react_extract/provider_finder/build/data/list-providers.json";

/** Fetched copy (see `pnpm fetch:ndis-list-providers`). */
export const NDIS_LIST_PROVIDERS_LOCAL_PATH = join(
  process.cwd(),
  "data",
  "ndis",
  "list-providers.json",
);

/** Legacy bundled export used by the provider finder UI. */
export const PROVIDER_OUTLETS_PUBLIC_PATH = join(
  process.cwd(),
  "public",
  "data",
  "provider-outlets.json",
);

export type NdisListProvidersFile = {
  date?: string;
  data: ProviderOutlet[];
};

function normalizePayload(parsed: unknown): NdisListProvidersFile {
  if (Array.isArray(parsed)) {
    return { data: parsed as ProviderOutlet[] };
  }
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      return {
        date: typeof obj.date === "string" ? obj.date : undefined,
        data: obj.data as ProviderOutlet[],
      };
    }
    if (Array.isArray(obj.providers)) {
      return { data: obj.providers as ProviderOutlet[] };
    }
  }
  throw new Error(
    "NDIS list-providers JSON: expected { data: [...] } or a top-level array.",
  );
}

export function resolveNdisListProvidersPath(
  explicitPath?: string,
): string {
  if (explicitPath?.trim()) return explicitPath.trim();
  if (existsSync(NDIS_LIST_PROVIDERS_LOCAL_PATH)) {
    return NDIS_LIST_PROVIDERS_LOCAL_PATH;
  }
  if (existsSync(PROVIDER_OUTLETS_PUBLIC_PATH)) {
    return PROVIDER_OUTLETS_PUBLIC_PATH;
  }
  throw new Error(
    `No NDIS provider list found. Run pnpm fetch:ndis-list-providers or place JSON at ${NDIS_LIST_PROVIDERS_LOCAL_PATH}`,
  );
}

export async function loadNdisListProviders(
  explicitPath?: string,
): Promise<NdisListProvidersFile> {
  const path = resolveNdisListProvidersPath(explicitPath);
  const raw = await readFile(path, "utf8");
  return normalizePayload(JSON.parse(raw) as unknown);
}

/** Parse in-memory JSON (tests). */
export function parseNdisListProvidersJson(raw: string): NdisListProvidersFile {
  return normalizePayload(JSON.parse(raw) as unknown);
}
