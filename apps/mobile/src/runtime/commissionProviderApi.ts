export type CommissionProvider = {
  id: string;
  name: string;
  legalName: string;
  abn: string | null;
  registrationNumber: string | null;
  state: string | null;
  registration: { status: string; source: string; asOf: string };
  workerScreening: { status: "not_independently_verified" };
  accessibility: { status: "unknown" };
};
export type ProviderSearchPage = {
  data: CommissionProvider[];
  meta: { sourceUrl: string; sourceAsOf: string; total: number; page: number; nextPage: number | null };
};
export async function searchCommissionProviders(
  q: string,
  state: string,
  page = 1,
  signal?: AbortSignal,
): Promise<ProviderSearchPage> {
  const origin = (process.env.EXPO_PUBLIC_MAPABLE_API_URL ?? "").trim().replace(/\/+$/, "");
  if (!/^https:\/\//.test(origin)) throw new Error("Secure MapAble API connection is not configured.");
  if (!q.trim() && !state) throw new Error("Enter a provider name or select a state.");
  const params = new URLSearchParams({ q: q.trim().slice(0, 120), page: String(page), limit: "20" });
  if (state) params.set("state", state);
  const response = await fetch(`${origin}/api/v1/provider-registry/search?${params.toString()}`, {
    headers: { Accept: "application/json" }, signal,
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(response.status === 503
    ? "The official provider register is not available on MapAble yet."
    : "Provider search failed. Please try again.");
  if (!result || typeof result !== "object" || !("data" in result) || !Array.isArray(result.data) ||
      !("meta" in result) || !result.meta || typeof result.meta !== "object") {
    throw new Error("Provider search returned an unexpected response.");
  }
  return result as ProviderSearchPage;
}
