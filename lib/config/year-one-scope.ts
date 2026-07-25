/**
 * Year-One product scope: Core, Care, Transport, Jobs (+ Access discovery).
 * Foods, Kids, Moves, and Marketplace are deferred — hidden from nav and
 * gated behind opt-in flags. Do not treat flag=false as a production claim.
 */

export const YEAR_ONE_CORE_MODULES = [
  "core",
  "care",
  "transport",
  "jobs",
] as const;

export type YearOneCoreModule = (typeof YEAR_ONE_CORE_MODULES)[number];

/** Premature verticals excluded from Sydney pilot navigation. */
export const YEAR_ONE_DEFERRED_MODULE_PATHS = [
  "/foods",
  "/kids",
  "/moves",
  "/marketplace",
] as const;

export type YearOneDeferredPath =
  (typeof YEAR_ONE_DEFERRED_MODULE_PATHS)[number];

function envEnabled(name: string): boolean {
  return process.env[name] === "true";
}

/** Opt-in only — default off for Year-One. */
export const yearOneScopeConfig = {
  foodsEnabled: envEnabled("MAPABLE_FOODS_ENABLED"),
  kidsEnabled: envEnabled("MAPABLE_KIDS_ENABLED"),
  movesEnabled: envEnabled("MAPABLE_MOVES_ENABLED"),
  marketplaceEnabled: envEnabled("MAPABLE_MARKETPLACE_ENABLED"),
};

export function isYearOneDeferredPathEnabled(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  if (path === "/foods" || path.startsWith("/foods/")) {
    return yearOneScopeConfig.foodsEnabled;
  }
  if (path === "/kids" || path.startsWith("/kids/")) {
    return yearOneScopeConfig.kidsEnabled;
  }
  if (path === "/moves" || path.startsWith("/moves/")) {
    return yearOneScopeConfig.movesEnabled;
  }
  if (path === "/marketplace" || path.startsWith("/marketplace/")) {
    return yearOneScopeConfig.marketplaceEnabled;
  }
  return true;
}

export function isMarketplaceSurfaceEnabled(): boolean {
  return yearOneScopeConfig.marketplaceEnabled;
}
