import {
  isOpenSearchConfigured,
  openSearchConfig,
} from "@/lib/config/opensearch";

function authHeader(): string {
  const { username, password } = openSearchConfig;
  const token = Buffer.from(`${username}:${password}`).toString("base64");
  return `Basic ${token}`;
}

/** Authenticated fetch against the configured OpenSearch cluster. */
export async function openSearchFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  if (!isOpenSearchConfigured()) {
    throw new Error("OpenSearch is not configured");
  }

  const base = openSearchConfig.url.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return fetch(`${base}${normalizedPath}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}
