import {
  auspostPacNotConfiguredError,
  auspostPacUpstreamError,
} from "@/lib/auspost-pac/auspost-pac-api-error";
import { auspostPacConfig, isAuspostPacConfigured } from "@/lib/config/auspost-pac";

type AuspostPacFetchOptions = {
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  accept?: string;
};

const memoryCache = new Map<string, { expiresAt: number; body: unknown }>();

function buildUrl(path: string, query?: AuspostPacFetchOptions["query"]): string {
  const base = auspostPacConfig.baseUrl.replace(/\/$/, "");
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

export async function auspostPacGetJson<T>(
  options: AuspostPacFetchOptions,
): Promise<T> {
  if (!isAuspostPacConfigured()) {
    throw auspostPacNotConfiguredError();
  }

  const url = buildUrl(options.path, options.query);
  const ttlMs = auspostPacConfig.cacheTtlSeconds * 1000;
  const cached = memoryCache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.body as T;
  }

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "AUTH-KEY": auspostPacConfig.apiKey!.trim(),
      Accept: options.accept ?? "application/json",
    },
    next: { revalidate: auspostPacConfig.cacheTtlSeconds },
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    let detail: string | undefined;
    try {
      const parsed = JSON.parse(text) as { error?: { errorMessage?: string } };
      detail = parsed.error?.errorMessage;
    } catch {
      detail = text.slice(0, 200) || undefined;
    }
    throw auspostPacUpstreamError(res.status, detail);
  }

  let body: T;
  try {
    body = JSON.parse(text) as T;
  } catch {
    throw auspostPacUpstreamError(res.status, "Invalid JSON from Australia Post");
  }

  memoryCache.set(url, { expiresAt: Date.now() + ttlMs, body });
  return body;
}

/** Clears in-memory cache (for tests). */
export function clearAuspostPacClientCache(): void {
  memoryCache.clear();
}
