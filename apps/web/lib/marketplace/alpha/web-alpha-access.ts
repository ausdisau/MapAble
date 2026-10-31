/**
 * Server-only closed-alpha admission, distinct from public Marketplace.
 * Authenticated MapAble users must be explicitly listed by exact internal user ID.
 * A preview-enabled app with NO allowlist is DENIED by default.
 *
 * No "NEXT_PUBLIC_" flags, email substring matching, wildcard or admin bypass.
 * This protects access to the UI only; future APIs still need their own auth.
 */
export interface WebAlphaConfig {
  MAPABLE_MARKETPLACE_WEB_ALPHA_ENABLED?: string;
  MAPABLE_MARKETPLACE_ALPHA_ALLOWED_USER_IDS?: string;
  VERCEL_ENV?: string;
}

export function isWebAlphaAllowed(
  userId: string | null | undefined,
  environment: WebAlphaConfig,
): boolean {
  if (!userId || userId.trim() !== userId || userId.length > 128) return false;
  if (environment.VERCEL_ENV === "production") return false;
  if (environment.MAPABLE_MARKETPLACE_WEB_ALPHA_ENABLED !== "true") return false;
  const list = environment.MAPABLE_MARKETPLACE_ALPHA_ALLOWED_USER_IDS ?? "";
  if (list.length > 4096) return false;
  const allowed = list.split(",").map((value) => value.trim()).filter(Boolean);
  if (allowed.length === 0 || allowed.length > 32) return false;
  return allowed.includes(userId);
}
