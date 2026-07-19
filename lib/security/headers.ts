/**
 * Baseline security headers for Wave 0.
 * CSP is Report-Only until enforcement is proven safe in a later wave.
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

function joinSources(sources: readonly string[]): string {
  return sources.join(" ");
}

export function buildContentSecurityPolicyReportOnly(): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${joinSources(CSP_EXTERNAL_ORIGINS.scripts)}`,
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
  ];
  return directives.join("; ");
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
