/** Normalize email for credential lookup (matches authorize + register API). */
export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Restrict post-login redirects to same-app relative paths.
 * Rejects protocol-relative URLs (`//evil.com`) and off-site targets.
 */
export function safeAuthCallbackPath(
  callbackUrl: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!callbackUrl) return fallback;
  const path = callbackUrl.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}

/** Full navigation after auth so middleware sees the new session cookie. */
export function redirectAfterAuth(callbackUrl: string): void {
  if (typeof window === "undefined") return;
  window.location.assign(callbackUrl);
}
