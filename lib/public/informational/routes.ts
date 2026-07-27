/**
 * Canonical inventory for the public informational-site release boundary.
 *
 * Used by sitemap generation, Playwright runtime/a11y suites, and docs —
 * not test-only. Transactional / participant systems remain in the codebase
 * but must not be marketed as available by informational CTAs.
 */

export type InformationalRouteKind = "informational" | "programme_explainer";

export type InformationalRoute = {
  path: string;
  label: string;
  /** Expected in sitemap.xml when true. */
  inSitemap: boolean;
  /** Substring expected in <title> (case-insensitive). */
  titleIncludes: string;
  /** Substring expected in the primary h1. */
  h1Includes: string;
  /** Contact (or other) forms allowed on this page. */
  formsPermitted: boolean;
  /** Auth must not be required to view. */
  authenticationProhibited: boolean;
  kind: InformationalRouteKind;
};

/** Core informational release surface. */
export const PUBLIC_INFORMATIONAL_ROUTES: readonly InformationalRoute[] = [
  {
    path: "/",
    label: "Homepage",
    inSitemap: true,
    titleIncludes: "MapAble",
    // Marketing hero: "Accessibility you can plan around."
    h1Includes: "Accessibility",
    // Guided search panel is a GET discovery form (not a contact/PII intake).
    formsPermitted: true,
    authenticationProhibited: true,
    kind: "informational",
  },
  {
    path: "/about",
    label: "About",
    inSitemap: true,
    titleIncludes: "About",
    h1Includes: "accessibility",
    formsPermitted: false,
    authenticationProhibited: true,
    kind: "informational",
  },
  {
    path: "/contact",
    label: "Contact",
    inSitemap: true,
    titleIncludes: "Contact",
    h1Includes: "Contact",
    formsPermitted: true,
    authenticationProhibited: true,
    kind: "informational",
  },
  {
    path: "/privacy",
    label: "Privacy",
    inSitemap: true,
    titleIncludes: "Privacy",
    h1Includes: "Privacy",
    formsPermitted: false,
    authenticationProhibited: true,
    kind: "informational",
  },
  {
    path: "/terms",
    label: "Terms",
    inSitemap: true,
    titleIncludes: "Terms",
    h1Includes: "Terms",
    formsPermitted: false,
    authenticationProhibited: true,
    kind: "informational",
  },
  {
    path: "/accessibility-statement",
    label: "Accessibility statement",
    inSitemap: true,
    titleIncludes: "Accessibility",
    h1Includes: "Accessibility",
    formsPermitted: false,
    authenticationProhibited: true,
    kind: "informational",
  },
  {
    path: "/guides",
    label: "Guides",
    inSitemap: true,
    titleIncludes: "Guide",
    h1Includes: "guide",
    formsPermitted: false,
    authenticationProhibited: true,
    kind: "informational",
  },
  {
    path: "/resources",
    label: "Resources",
    inSitemap: true,
    titleIncludes: "Resources",
    h1Includes: "resource",
    formsPermitted: false,
    authenticationProhibited: true,
    kind: "informational",
  },
  {
    path: "/help",
    label: "Help",
    inSitemap: true,
    titleIncludes: "Help",
    h1Includes: "help",
    formsPermitted: false,
    authenticationProhibited: true,
    kind: "informational",
  },
  {
    path: "/data-deletion",
    label: "Data deletion",
    inSitemap: true,
    titleIncludes: "Data deletion",
    h1Includes: "deletion",
    formsPermitted: false,
    authenticationProhibited: true,
    kind: "informational",
  },
] as const;

/**
 * Programme explainer pages — may appear in nav/sitemap but must not claim
 * live transactional booking/matching availability.
 */
export const PUBLIC_PROGRAMME_EXPLAINER_ROUTES: readonly InformationalRoute[] =
  [
    {
      path: "/care",
      label: "Care (explainer)",
      inSitemap: true,
      titleIncludes: "Care",
      h1Includes: "support",
      formsPermitted: false,
      authenticationProhibited: true,
      kind: "programme_explainer",
    },
    {
      path: "/transport",
      label: "Transport (explainer)",
      inSitemap: true,
      titleIncludes: "Transport",
      h1Includes: "Accessible",
      formsPermitted: false,
      authenticationProhibited: true,
      kind: "programme_explainer",
    },
    {
      path: "/employment",
      label: "Employment (explainer)",
      inSitemap: true,
      titleIncludes: "Employment",
      h1Includes: "employment",
      formsPermitted: false,
      authenticationProhibited: true,
      kind: "programme_explainer",
    },
    {
      path: "/marketplace",
      label: "Marketplace (explainer)",
      inSitemap: true,
      titleIncludes: "Marketplace",
      h1Includes: "aids",
      formsPermitted: false,
      authenticationProhibited: true,
      kind: "programme_explainer",
    },
    {
      path: "/foods",
      label: "Foods (explainer)",
      inSitemap: true,
      titleIncludes: "Foods",
      h1Includes: "Meal",
      formsPermitted: false,
      authenticationProhibited: true,
      kind: "programme_explainer",
    },
    {
      path: "/kids",
      label: "Kids (explainer)",
      inSitemap: true,
      titleIncludes: "Kids",
      h1Includes: "Family",
      formsPermitted: false,
      authenticationProhibited: true,
      kind: "programme_explainer",
    },
    {
      path: "/moves",
      label: "Moves (explainer)",
      inSitemap: true,
      titleIncludes: "Moves",
      h1Includes: "Move",
      formsPermitted: false,
      authenticationProhibited: true,
      kind: "programme_explainer",
    },
  ] as const;

/** Full allowlist for the informational GO gate. */
export const INFORMATIONAL_RELEASE_ROUTES: readonly InformationalRoute[] = [
  ...PUBLIC_INFORMATIONAL_ROUTES,
  ...PUBLIC_PROGRAMME_EXPLAINER_ROUTES,
] as const;

/** Paths that must not be marketed as available for the informational GO. */
export const EXCLUDED_TRANSACTIONAL_PATH_PREFIXES = [
  "/dashboard",
  "/api/bookings",
  "/api/payments",
  "/api/claims",
  "/api/matching",
  "/care/request",
  "/transport/request",
  "/transport/book",
  "/provider/ndis-claims",
  "/marketplace/browse",
  "/marketplace/cart",
  "/marketplace/products",
] as const;

/**
 * Auth entry points remain separately governed production capabilities.
 * They are not part of the informational allowlist and must not be removed
 * solely for this release boundary.
 */
export const GOVERNED_AUTH_PATHS = ["/login", "/register"] as const;

/** Homepage / marketing CTAs permitted for the informational release. */
export const INFORMATIONAL_SAFE_CTAS = [
  { label: "Pre-register interest", href: "#pre-register" },
  { label: "Explore accessible places", href: "/accessibility-map" },
  { label: "About MapAble", href: "/about" },
  { label: "Contact MapAble", href: "/contact" },
] as const;

export function informationalRoutePaths(): string[] {
  return INFORMATIONAL_RELEASE_ROUTES.map((r) => r.path);
}

export function informationalSitemapPaths(): string[] {
  return INFORMATIONAL_RELEASE_ROUTES.filter((r) => r.inSitemap).map((r) =>
    r.path === "/" ? "" : r.path,
  );
}

export function isInformationalReleasePath(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  return INFORMATIONAL_RELEASE_ROUTES.some((r) => r.path === normalized);
}

export function isExcludedTransactionalPath(pathname: string): boolean {
  return EXCLUDED_TRANSACTIONAL_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
