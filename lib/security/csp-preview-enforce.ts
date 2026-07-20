/**
 * Preview-only CSP enforcement gate.
 *
 * Fail-closed: never enables enforcing Content-Security-Policy in production,
 * even if MAPABLE_CSP_ENFORCE_PREVIEW is mistakenly set.
 */

export const CSP_PREVIEW_ENFORCE_FLAG = "MAPABLE_CSP_ENFORCE_PREVIEW";
export const CSP_NONCE_HEADER = "x-nonce";
export const CSP_ENFORCE_HEADER = "Content-Security-Policy";

export function isCspPreviewEnforceEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env[CSP_PREVIEW_ENFORCE_FLAG] !== "true") return false;

  // Hard-off on Vercel production and any explicit production env label.
  if (env.VERCEL_ENV === "production") return false;

  if (env.VERCEL === "1") {
    // Only Vercel preview deployments may enforce when the flag is on.
    return env.VERCEL_ENV === "preview";
  }

  // Local / CI unit tests — never treat bare NODE_ENV=production as eligible.
  return (
    env.NODE_ENV === "development" ||
    env.NODE_ENV === "test" ||
    env.VITEST === "true"
  );
}

export function createScriptNonce(): string {
  // Hex nonce from random bytes — Edge-safe (no Node Buffer / btoa dependency).
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
