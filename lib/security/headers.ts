/**
 * Baseline security headers for controlled-pilot.
 *
 * CSP default remains Report-Only until a nonce/hash enforcement path is proven
 * safe against Next.js, authentication, Stripe, maps, and required analytics.
 * See docs/remediation/CSP_ENFORCEMENT.md.
 */

/** Inventoried third-party origins used by the public app shell. */
export const CSP_EXTERNAL_ORIGINS = {
  scripts: [
    "https://pagead2.googlesyndication.com",
    "https://www.googletagmanager.com",
    "https://js.stripe.com",
    "https://va.vercel-scripts.com",
  ],
  styles: ["https://fonts.googleapis.com"],
  fonts: ["https://fonts.gstatic.com"],
  images: [
    "https://*.tile.openstreetmap.org",
    "https://*.basemaps.cartocdn.com",
    "https://api.maptiler.com",
    "data:",
    "blob:",
  ],
  connect: [
    "https://*.mapable.com.au",
    "https://api.stripe.com",
    "https://*.googleapis.com",
    "https://*.tile.openstreetmap.org",
    "https://api.maptiler.com",
    "https://vitals.vercel-insights.com",
  ],
  frames: ["https://js.stripe.com", "https://hooks.stripe.com"],
  workers: ["blob:"],
} as const;

export type CspBuildOptions = {
  /**
   * When set, script-src uses nonce and omits 'unsafe-eval'.
   * Callers must inject the matching nonce on every required inline script.
   */
  scriptNonce?: string;
  /** Include 'unsafe-eval' — only for report-only compatibility with current Next.js tooling. */
  allowUnsafeEval?: boolean;
};

function joinSources(sources: readonly string[]): string {
  return sources.join(" ");
}

export function buildContentSecurityPolicy(
  options: CspBuildOptions = {},
): string {
  const allowUnsafeEval = options.allowUnsafeEval ?? !options.scriptNonce;
  const scriptSources = ["'self'"];
  if (options.scriptNonce) {
    scriptSources.push(`'nonce-${options.scriptNonce}'`);
  } else {
    // Report-only compatibility path still requires unsafe-inline until nonces ship.
    scriptSources.push("'unsafe-inline'");
  }
  if (allowUnsafeEval) {
    scriptSources.push("'unsafe-eval'");
  }
  scriptSources.push(...CSP_EXTERNAL_ORIGINS.scripts);

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    `style-src 'self' 'unsafe-inline' ${joinSources(CSP_EXTERNAL_ORIGINS.styles)}`,
    `font-src 'self' ${joinSources(CSP_EXTERNAL_ORIGINS.fonts)} data:`,
    `img-src 'self' ${joinSources(CSP_EXTERNAL_ORIGINS.images)}`,
    `connect-src 'self' ${joinSources(CSP_EXTERNAL_ORIGINS.connect)}`,
    `frame-src 'self' ${joinSources(CSP_EXTERNAL_ORIGINS.frames)}`,
    `worker-src 'self' ${joinSources(CSP_EXTERNAL_ORIGINS.workers)}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Report sink redacts URI query/secrets — see app/api/security/csp-report
    "report-uri /api/security/csp-report",
  ];
  return directives.join("; ");
}

/** Current production header value — report-only, includes unsafe-eval. */
export function buildContentSecurityPolicyReportOnly(): string {
  return buildContentSecurityPolicy({ allowUnsafeEval: true });
}

/**
 * Future enforce builder. Do not wire into next.config until smoke tests prove
 * Next.js/auth/Stripe/maps survive without unsafe-eval (nonce injection required).
 */
export function buildContentSecurityPolicyEnforce(scriptNonce: string): string {
  if (!scriptNonce.trim()) {
    throw new Error("CSP enforce requires a non-empty script nonce");
  }
  return buildContentSecurityPolicy({
    scriptNonce: scriptNonce.trim(),
    allowUnsafeEval: false,
  });
}

export type SecurityHeader = { key: string; value: string };

/** Headers applied to all routes. HSTS is left to Vercel. */
export function getBaselineSecurityHeaders(): SecurityHeader[] {
  return [
    {
      key: "Content-Security-Policy-Report-Only",
      value: buildContentSecurityPolicyReportOnly(),
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()",
    },
    { key: "X-Frame-Options", value: "DENY" },
  ];
}
