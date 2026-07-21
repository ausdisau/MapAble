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

  // Hard-off on Vercel production (and any host labeled VERCEL_ENV=production).
  if (env.VERCEL_ENV === "production") return false;

  if (env.VERCEL === "1") {
    // Only Vercel preview deployments may enforce when the flag is on.
    return env.VERCEL_ENV === "preview";
  }

  // Non-Vercel: allow local/CI including `next start` (NODE_ENV=production).
  // Production apex remains hard-off via VERCEL_ENV=production above.
  return true;
}

export function createScriptNonce(): string {
  // Hex nonce from random bytes — Edge-safe (no Node Buffer / btoa dependency).
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Assert enforce policy shape for tests and CI smoke (does not enable the flag).
 */
export function assertEnforcePolicyShape(
  policy: string,
  nonce: string,
): string[] {
  const failures: string[] = [];
  if (!nonce.trim()) failures.push("nonce_empty");
  if (!policy.includes(`'nonce-${nonce}'`)) failures.push("nonce_missing");
  if (policy.includes("'unsafe-eval'")) failures.push("unsafe_eval_present");
  if (/(?:^|;\s*)(?:default-src|script-src)[^;]*\s\*(?:\s|;|$)/.test(policy)) {
    failures.push("unrestricted_wildcard");
  }
  if (!policy.includes("object-src 'none'")) failures.push("object_src");
  if (!policy.includes("frame-ancestors 'none'")) {
    failures.push("frame_ancestors");
  }
  if (!policy.includes("report-uri /api/security/csp-report")) {
    failures.push("report_uri");
  }
  return failures;
}
