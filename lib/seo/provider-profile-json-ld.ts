import type { Provider } from "@/app/provider-finder/providers";
import { getCanonicalPublicOrigin } from "@/lib/config/canonical-url";
import type { JsonLdGraph } from "@/lib/config/json-ld";
import {
  buildProviderLocalBusinessJsonLd,
  buildProviderServiceJsonLd,
} from "@/lib/seo/service-json-ld";

/**
 * Build LocalBusiness (+ optional Service) JSON-LD for a provider profile page.
 */
export function buildProviderProfileJsonLd(
  provider: Provider,
  env: NodeJS.ProcessEnv = process.env,
): JsonLdGraph[] {
  const origin = getCanonicalPublicOrigin(env);
  const profileUrl = `${origin}/jonathan/profile/${encodeURIComponent(provider.slug)}`;
  const primaryCategory = provider.categories[0] ?? "Disability support";

  const localBusiness = buildProviderLocalBusinessJsonLd({
    name: provider.name,
    description: `${provider.name} offers ${primaryCategory.toLowerCase()} and related supports for people seeking accessible places, NDIS providers, and inclusive community services.`,
    url: profileUrl,
    suburb: provider.suburb === "Remote" ? undefined : provider.suburb,
    state: provider.state,
    postcode: provider.postcode,
    latitude: provider.latitude,
    longitude: provider.longitude,
    telephone: provider.phone,
    email: provider.email,
    sameAs: provider.website,
    abn: provider.abn,
    categories: provider.categories,
    ndisRegistered: provider.registered,
    areaServed: provider.suburb === "Remote" ? "AU" : provider.state,
  });

  const service = buildProviderServiceJsonLd({
    name: primaryCategory,
    description: `${primaryCategory} from ${provider.name} via MapAble Australia.`,
    url: profileUrl,
    serviceType: provider.categories,
    providerName: provider.name,
    providerUrl: profileUrl,
    ndisRegistered: provider.registered,
    areaServed: "Australia",
  });

  return [localBusiness, service];
}
