export function isDirectusEnabled(): boolean {
  return process.env.DIRECTUS_ENABLED === "true";
}

export function getDirectusConfig() {
  return {
    url: process.env.DIRECTUS_URL ?? "",
    token: process.env.DIRECTUS_STATIC_TOKEN ?? "",
  };
}

export async function directusFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const { url, token } = getDirectusConfig();
  if (!isDirectusEnabled() || !url || !token) {
    throw new Error("Directus not configured");
  }
  const res = await fetch(`${url.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`Directus request failed: ${res.status}`);
  return res.json() as Promise<T>;
}
