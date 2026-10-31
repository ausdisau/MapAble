/**
 * Pure desktop navigation rules. No arbitrary website, file URI, or non-local
 * HTTP traffic may become the authenticated MapAble renderer.
 * Packaged distribution is blocked until separately approved.
 */
export interface DesktopOriginConfig {
  readonly value: string | undefined;
  readonly packaged: boolean;
  readonly releaseApproved: boolean;
  readonly reviewedOrigin?: string;
}

export function resolveDesktopOrigin(config: DesktopOriginConfig): string {
  if (!config.value) throw new Error("MAPABLE_DESKTOP_ALPHA_ORIGIN is required.");
  let url: URL;
  try { url = new URL(config.value); } catch { throw new Error("Invalid desktop alpha origin."); }
  const noExtra = url.pathname === "/" && url.search === "" && url.hash === "" &&
    !url.username && !url.password && !url.username && !url.password;
  if (!noExtra) throw new Error("Configure only an origin, without path, credentials or query.");
  if (config.packaged) {
    if (!config.releaseApproved || !config.reviewedOrigin ||
        url.origin !== config.reviewedOrigin || url.protocol !== "https:")
      throw new Error("Packaged desktop use needs an approved HTTPS origin.");
  } else {
    const local = ["127.0.0.1", "localhost"].includes(url.hostname);
    if (!(url.protocol === "https:" || (url.protocol === "http:" && local)))
      throw new Error("Development permits only HTTPS or local HTTP.");
  }
  return url.origin;
}

const BLOCKED = [
  "/api/billing", "/api/stripe", "/api/payments",
  "/marketplace/cart", "/marketplace/checkout", "/checkout",
];

export function isAllowedDesktopUrl(
  raw: string, origin: string,
  dev = false,
): boolean {
  try {
    const url = new URL(raw);
    if (url.origin !== origin || url.username || url.password) return false;
    if (url.protocol !== "https:" &&
        !(dev && url.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(url.hostname))) return false;
    if (url.pathname.includes("\\") || url.pathname.includes("%2f") ||
        url.pathname.includes("%2F")) return false;
    if (BLOCKED.some((prefix) => url.pathname === prefix ||
        url.pathname.startsWith(prefix + "/"))) return false;
    return true;
  } catch {
    return false;
  }
}
