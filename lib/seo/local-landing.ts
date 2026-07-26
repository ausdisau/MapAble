import type { Provider } from "@/app/provider-finder/providers";
import { PROVIDERS } from "@/app/provider-finder/providers";

/** Facility-first service taxonomy for programmatic local SEO landings. */
export type LocalSeoService = {
  slug: string;
  label: string;
  /** Matches Provider.categories (case-insensitive contains / exact). */
  categories: string[];
  /** Extra keyword phrases for copy and matching. */
  keywords: string[];
};

/**
 * Hyper-local service slugs (e.g. accessible-physiotherapy).
 * Focused on brick-and-mortar / infrastructure intent vs freelancer marketplaces.
 */
export const LOCAL_SEO_SERVICES: readonly LocalSeoService[] = [
  {
    slug: "accessible-physiotherapy",
    label: "Accessible physiotherapy",
    categories: ["Therapeutic Supports"],
    keywords: ["physiotherapy", "physio", "physical therapy"],
  },
  {
    slug: "occupational-therapy",
    label: "Occupational therapy",
    categories: ["Therapeutic Supports"],
    keywords: ["occupational therapy", "ot assessment"],
  },
  {
    slug: "support-coordination",
    label: "Support coordination",
    categories: ["Support Coordination"],
    keywords: ["support coordination", "coordinator"],
  },
  {
    slug: "ndis-transport",
    label: "NDIS accessible transport",
    categories: ["Transport"],
    keywords: ["transport", "accessible transport", "wheelchair"],
  },
  {
    slug: "personal-care",
    label: "Personal care",
    categories: ["Assistance with Daily Life"],
    keywords: ["personal care", "daily living", "support worker"],
  },
  {
    slug: "employment-supports",
    label: "Employment supports",
    categories: ["Employment Supports"],
    keywords: ["employment", "job", "des"],
  },
  {
    slug: "community-participation",
    label: "Community participation",
    categories: ["Community Participation"],
    keywords: ["community", "social", "participation"],
  },
  {
    slug: "assistive-technology",
    label: "Assistive technology",
    categories: ["Assistive Technology"],
    keywords: ["assistive technology", "at", "equipment"],
  },
  {
    slug: "home-modifications",
    label: "Home modifications",
    categories: ["Home Modifications"],
    keywords: ["home modifications", "ramps", "bathroom"],
  },
] as const;

/** Seed suburbs for high-intent local landings beyond current demo outlets. */
export const LOCAL_SEO_SEED_SUBURBS: readonly string[] = [
  "allambie-heights",
  "parramatta",
  "footscray",
  "chermside",
  "bayswater",
  "geelong",
  "newcastle",
  "hobart",
];

export function toSeoSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleCaseFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function resolveLocalService(serviceSlug: string): LocalSeoService | null {
  const normalised = toSeoSlug(serviceSlug);
  return (
    LOCAL_SEO_SERVICES.find((service) => service.slug === normalised) ?? null
  );
}

function providerMatchesService(
  provider: Provider,
  service: LocalSeoService,
): boolean {
  const haystack = [
    ...provider.categories,
    ...provider.supports,
    provider.name,
  ]
    .join(" ")
    .toLowerCase();

  const categoryHit = service.categories.some((category) =>
    provider.categories.some(
      (c) => c.toLowerCase() === category.toLowerCase(),
    ),
  );
  if (categoryHit) return true;

  return service.keywords.some((keyword) => haystack.includes(keyword));
}

function providerMatchesSuburb(provider: Provider, suburbSlug: string): boolean {
  if (provider.suburb === "Remote") return false;
  return toSeoSlug(provider.suburb) === toSeoSlug(suburbSlug);
}

export function filterProvidersForLocalLanding(
  suburbSlug: string,
  serviceSlug: string,
  providers: readonly Provider[] = PROVIDERS,
): Provider[] {
  const service = resolveLocalService(serviceSlug);
  if (!service) return [];

  const local = providers.filter(
    (provider) =>
      providerMatchesSuburb(provider, suburbSlug) &&
      providerMatchesService(provider, service),
  );

  if (local.length > 0) return local;

  // Soft expand: same service in neighbouring demo set (state-agnostic fallback)
  // so facility-first landings still show useful directory HTML for FCP.
  return providers
    .filter((provider) => providerMatchesService(provider, service))
    .slice(0, 8);
}

export type LocalLandingParams = {
  suburb: string;
  service: string;
};

export function buildLocalLandingStaticParams(
  providers: readonly Provider[] = PROVIDERS,
): LocalLandingParams[] {
  const pairs = new Set<string>();
  const params: LocalLandingParams[] = [];

  const push = (suburb: string, service: string) => {
    const key = `${suburb}::${service}`;
    if (pairs.has(key)) return;
    pairs.add(key);
    params.push({ suburb, service });
  };

  for (const suburb of LOCAL_SEO_SEED_SUBURBS) {
    for (const service of LOCAL_SEO_SERVICES) {
      push(suburb, service.slug);
    }
  }

  for (const provider of providers) {
    if (provider.suburb === "Remote") continue;
    const suburb = toSeoSlug(provider.suburb);
    for (const service of LOCAL_SEO_SERVICES) {
      if (providerMatchesService(provider, service)) {
        push(suburb, service.slug);
      }
    }
  }

  return params;
}

export function buildLocalLandingCopy(input: {
  suburbSlug: string;
  service: LocalSeoService;
  resultCount: number;
}): { title: string; description: string; h1: string; intro: string } {
  const suburbLabel = titleCaseFromSlug(input.suburbSlug);
  const serviceLabel = input.service.label;
  const title = `${serviceLabel} in ${suburbLabel}`;
  const description = `Compare ${serviceLabel.toLowerCase()} providers near ${suburbLabel}. MapAble lists brick-and-mortar NDIS services, accessible facilities, and inclusive community infrastructure — not freelancer marketplaces.`;
  const h1 = `${serviceLabel} near ${suburbLabel}`;
  const intro =
    input.resultCount > 0
      ? `Explore ${input.resultCount} ${serviceLabel.toLowerCase()} option${input.resultCount === 1 ? "" : "s"} for ${suburbLabel}, with facility and access signals surfaced first.`
      : `We are building a facility-first directory of ${serviceLabel.toLowerCase()} near ${suburbLabel}. Browse related providers below or open the full Provider Finder.`;

  return { title, description, h1, intro };
}
