import { tfnswConfig, isTfnswConfigured } from "@/lib/config/tfnsw";
import { tfnswNotConfiguredError, tfnswUpstreamError } from "@/lib/tfnsw/tfnsw-api-error";

type TfnswFetchOptions = {
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  accept?: string;
};

const memoryCache = new Map<string, { expiresAt: number; body: unknown }>();

function buildUrl(path: string, query?: TfnswFetchOptions["query"]): string {
  const base = tfnswConfig.baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

function cacheKey(url: string): string {
  return url;
}

export async function tfnswGetJson<T>(options: TfnswFetchOptions): Promise<T> {
  if (!isTfnswConfigured()) {
    throw tfnswNotConfiguredError();
  }

  const url = buildUrl(options.path, options.query);
  const key = cacheKey(url);
  const ttlMs = tfnswConfig.cacheTtlSeconds * 1000;
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.body as T;
  }

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `apikey ${tfnswConfig.apiKey!.trim()}`,
      Accept: options.accept ?? "application/json",
    },
    next: { revalidate: tfnswConfig.cacheTtlSeconds },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw tfnswUpstreamError(
      res.status,
      text.slice(0, 200) || undefined
    );
  }

  const body = (await res.json()) as T;
  memoryCache.set(key, { expiresAt: Date.now() + ttlMs, body });
  return body;
}

/** Clears in-memory cache (for tests) */
export function clearTfnswClientCache(): void {
  memoryCache.clear();
}
