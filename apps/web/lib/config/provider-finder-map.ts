export type ProviderFinderMapSource = "outlets" | "ndis" | "hybrid";

function parseMapSource(raw: string | undefined): ProviderFinderMapSource {
  const v = (raw ?? "outlets").toLowerCase();
  if (v === "ndis" || v === "hybrid") return v;
  return "outlets";
}

export function getProviderFinderMapSource(): ProviderFinderMapSource {
  return parseMapSource(process.env.PROVIDER_FINDER_MAP_SOURCE);
}

/** Client-side map source (requires NEXT_PUBLIC_ prefix). */
export function getProviderFinderMapSourceClient(): ProviderFinderMapSource {
  return parseMapSource(
    process.env.NEXT_PUBLIC_PROVIDER_FINDER_MAP_SOURCE ??
      process.env.PROVIDER_FINDER_MAP_SOURCE,
  );
}

export function getProviderFinderMapPinLimit(): number {
  const n = Number(process.env.PROVIDER_FINDER_MAP_PIN_LIMIT ?? "500");
  if (!Number.isFinite(n) || n < 1) return 500;
  return Math.min(Math.floor(n), 2000);
}

export function isAccessMapOverlayEnabled(): boolean {
  return process.env.ACCESS_MAP_OVERLAY_ENABLED === "true";
}
