/**
 * Year-One product scope: Core, Care, Transport, Jobs (+ Access discovery).
 *
 * Foods, Kids, Moves, and Marketplace keep public informational explainers.
 * Transactional marketplace surfaces (browse/cart/checkout) stay opt-in only.
 */

export const YEAR_ONE_CORE_MODULES = [
  "core",
  "care",
  "transport",
  "jobs",
] as const;

export type YearOneCoreModule = (typeof YEAR_ONE_CORE_MODULES)[number];

/** Public programme explainers (informational GO — not live commerce). */
export const YEAR_ONE_PUBLIC_EXPLAINER_PATHS = [
  "/foods",
  "/kids",
  "/moves",
  "/marketplace",
] as const;

/** Transactional marketplace paths gated behind MAPABLE_MARKETPLACE_ENABLED. */
export const YEAR_ONE_MARKETPLACE_TRANSACTIONAL_PREFIXES = [
  "/marketplace/browse",
  "/marketplace/cart",
  "/marketplace/products",
] as const;

function envEnabled(name: string): boolean {
  return process.env[name] === "true";
}

/** Opt-in only — default off for Year-One transactional commerce. */
export const yearOneScopeConfig = {
  marketplaceTransactionalEnabled: envEnabled("MAPABLE_MARKETPLACE_ENABLED"),
  /** @deprecated Alias — prefer marketplaceTransactionalEnabled */
  marketplaceEnabled: envEnabled("MAPABLE_MARKETPLACE_ENABLED"),
  /** Legacy flags retained for ops docs; public explainers are always on. */
  foodsEnabled: true,
  kidsEnabled: true,
  movesEnabled: true,
};

export function isMarketplaceTransactionalPath(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  return YEAR_ONE_MARKETPLACE_TRANSACTIONAL_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function isMarketplaceSurfaceEnabled(): boolean {
  return yearOneScopeConfig.marketplaceTransactionalEnabled;
}

/**
 * Public explainers are always available. Only transactional marketplace
 * subpaths require MAPABLE_MARKETPLACE_ENABLED.
 */
export function isYearOneDeferredPathEnabled(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  if (isMarketplaceTransactionalPath(path)) {
    return yearOneScopeConfig.marketplaceTransactionalEnabled;
  }
  return true;
}
