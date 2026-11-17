/** Normalize email for credential lookup (matches authorize + register API). */
export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

const AUTH_FORM_PATH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

/** True when the path is an auth form (used to avoid nested forms and redirect loops). */
export function isAuthFormPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const bare = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  return AUTH_FORM_PATH_PREFIXES.some(
    (prefix) => bare === prefix || bare.startsWith(`${prefix}/`),
  );
}

/**
 * Restrict post-login redirects to same-app relative paths.
 * Rejects protocol-relative URLs (`//evil.com`), off-site targets, and
 * auth-form paths that would create a bounce loop after sign-in.
 */
export function safeAuthCallbackPath(
  callbackUrl: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!callbackUrl) return fallback;
  const path = callbackUrl.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (isAuthFormPath(path)) return fallback;
  return path;
}

/**
 * Build a same-app callback from the current path plus its query string.
 * `search` may include a leading `?`. Hash fragments are ignored.
 */
export function safeAuthCallbackFromLocation(
  pathname: string | null | undefined,
  search: string | null | undefined,
  fallback = "/dashboard",
): string {
  const path = pathname?.trim() ?? "";
  if (!path || isAuthFormPath(path)) {
    return safeAuthCallbackPath(null, fallback);
  }
  const query = (search ?? "").replace(/^\?/, "").trim();
  const combined = query ? `${path}?${query}` : path;
  return safeAuthCallbackPath(combined, fallback);
}

/** Full navigation after auth so middleware sees the new session cookie. */
export function redirectAfterAuth(callbackUrl: string): void {
  if (typeof window === "undefined") return;
  window.location.assign(callbackUrl);
}
