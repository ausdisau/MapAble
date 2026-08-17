/**
 * Marketing paths with enough unique content for AdSense display units.
 * Thin CTA shells (/telehealth, /peer, /providers, /pricing) are excluded
 * until their content is expanded.
 */
const CONTENT_RICH_EXACT = new Set([
  "/",
  "/resources",
  "/guides",
  "/about",
  "/for-providers",
  "/privacy",
  "/terms",
  "/accessibility-statement",
  "/contact",
  "/help",
  "/data-deletion",
]);

const CONTENT_RICH_PREFIXES = ["/guides/"] as const;

/**
 * Returns true when pathname is allowlisted for footer (and similar) ad units.
 */
export function isContentRichMarketingPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.split("?")[0]?.split("#")[0] || "";
  if (CONTENT_RICH_EXACT.has(path)) return true;
  return CONTENT_RICH_PREFIXES.some(
    (prefix) => path.startsWith(prefix) && path.length > prefix.length,
  );
}
