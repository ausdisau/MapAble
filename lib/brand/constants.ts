/** Public marketing site — https://mapable.com.au */
export const MAPABLE_MARKETING_URL = "https://mapable.com.au";

/** MapAble PEERS community — https://peer.mapable.com.au */
export const MAPABLE_PEER_PEERS_URL = "https://peer.mapable.com.au";

/** Short brand suite tagline (Canva MapAble brand kit). */
export const MAPABLE_BRAND_TAGLINE = "Empowering Independence";

export const MAPABLE_TAGLINE =
  "Enabling people with disabilities to live independent and dignified lives through innovative technology in care, transport, and employment.";

export const MAPABLE_SUPPORT_EMAIL = "support@mapable.com.au";

/** Australian Disability Ltd — PayPal donations (override in env). */
export const MAPABLE_DONATION_URL =
  process.env.NEXT_PUBLIC_DONATION_URL ?? "https://paypal.me/ausdisau";

/**
 * Official MapAble horizontal wordmark — use the exact PNG committed to the repo.
 * Render with a native <img> on a transparent background (marketing headers are light).
 */
export const MAPABLE_LOGO_SRC = "/brand/mapable-logo.png";

/** Pin + Australia mark for compact headers with separate text. */
export const MAPABLE_LOGO_MARK_SRC = "/brand/mapable-logo-mark.svg";

export const MAPABLE_LOGO_ALT = "MapAble — Empowering Independence";
