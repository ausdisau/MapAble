/**
 * Allowlist of public informational routes for the informational-site GO gate.
 *
 * Scope: unauthenticated marketing / legal / help content only.
 * Explicitly excludes auth, dashboards, bookings, matching, payments,
 * AT Continuity, and other transactional or participant-service surfaces.
 */

export type InformationalRoute = {
  path: string;
  /** Short label for inventory / evidence tables. */
  label: string;
  /** Expected in sitemap.xml when true. */
  inSitemap: boolean;
};

/** Core informational release surface. */
export const PUBLIC_INFORMATIONAL_ROUTES: readonly InformationalRoute[] = [
  { path: "/", label: "Homepage", inSitemap: true },
  { path: "/about", label: "About", inSitemap: true },
  { path: "/contact", label: "Contact", inSitemap: true },
  { path: "/privacy", label: "Privacy", inSitemap: true },
  { path: "/terms", label: "Terms", inSitemap: true },
  {
    path: "/accessibility-statement",
    label: "Accessibility statement",
    inSitemap: true,
  },
  { path: "/guides", label: "Guides", inSitemap: true },
  { path: "/resources", label: "Resources", inSitemap: true },
  { path: "/help", label: "Help", inSitemap: true },
  { path: "/data-deletion", label: "Data deletion", inSitemap: true },
] as const;

/**
 * Programme explainer pages that may appear in navigation/sitemap but must
 * not be represented as live transactional services in the informational GO.
 */
export const PUBLIC_PROGRAMME_EXPLAINER_ROUTES: readonly InformationalRoute[] =
  [
    { path: "/care", label: "Care (explainer)", inSitemap: true },
    { path: "/transport", label: "Transport (explainer)", inSitemap: true },
    { path: "/employment", label: "Employment (explainer)", inSitemap: true },
  ] as const;

/** Paths that must not be marketed as available for the informational GO. */
export const EXCLUDED_TRANSACTIONAL_PATH_PREFIXES = [
  "/login",
  "/register",
  "/dashboard",
  "/api/bookings",
  "/api/payments",
  "/api/claims",
  "/api/matching",
  "/care/request",
  "/transport/request",
] as const;

export function informationalRoutePaths(): string[] {
  return [
    ...PUBLIC_INFORMATIONAL_ROUTES,
    ...PUBLIC_PROGRAMME_EXPLAINER_ROUTES,
  ].map((r) => r.path);
}
