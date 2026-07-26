import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PROVIDERS } from "@/app/provider-finder/providers";
import { DirectoryView } from "@/components/DirectoryView";
import { LocalBusinessSchema } from "@/components/seo/LocalBusinessSchema";
import {
  canonicalAlternate,
  getCanonicalPublicOrigin,
} from "@/lib/config/canonical-url";
import {
  buildLocalLandingCopy,
  buildLocalLandingStaticParams,
  filterProvidersForLocalLanding,
  resolveLocalService,
  titleCaseFromSlug,
  toSeoSlug,
} from "@/lib/seo/local-landing";

type PageParams = {
  suburb: string;
  service: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

export function generateStaticParams(): PageParams[] {
  return buildLocalLandingStaticParams(PROVIDERS);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { suburb: suburbRaw, service: serviceRaw } = await params;
  const suburbSlug = toSeoSlug(suburbRaw);
  const service = resolveLocalService(serviceRaw);

  if (!service || !suburbSlug) {
    return {
      title: "Local providers",
      description:
        "Find NDIS providers, accessible transport, and facility-first disability services on MapAble Australia.",
    };
  }

  const results = filterProvidersForLocalLanding(suburbSlug, service.slug);
  const copy = buildLocalLandingCopy({
    suburbSlug,
    service,
    resultCount: results.length,
  });
  const pathname = `/provider-finder/${suburbSlug}/${service.slug}`;

  return {
    title: copy.title,
    description: copy.description,
    alternates: canonicalAlternate(pathname),
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: pathname,
      locale: "en_AU",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
    },
  };
}

export default async function ProviderFinderLocalLandingPage({
  params,
}: PageProps) {
  const { suburb: suburbRaw, service: serviceRaw } = await params;
  const suburbSlug = toSeoSlug(suburbRaw);
  const service = resolveLocalService(serviceRaw);

  if (!service || !suburbSlug) {
    notFound();
  }

  const providers = filterProvidersForLocalLanding(suburbSlug, service.slug);
  const copy = buildLocalLandingCopy({
    suburbSlug,
    service,
    resultCount: providers.length,
  });
  const suburbLabel = titleCaseFromSlug(suburbSlug);
  const origin = getCanonicalPublicOrigin();
  const landingUrl = `${origin}/provider-finder/${suburbSlug}/${service.slug}`;

  return (
    <main className="container mx-auto max-w-5xl space-y-8 px-4 py-10">
      {providers.map((provider) => (
        <LocalBusinessSchema
          key={provider.id}
          name={provider.name}
          service={service.label}
          suburb={provider.suburb === "Remote" ? suburbLabel : provider.suburb}
          state={provider.state}
          postcode={provider.postcode}
          url={`${origin}/jonathan/profile/${encodeURIComponent(provider.slug)}`}
          rating={provider.rating}
          reviewCount={provider.reviewCount}
          latitude={provider.latitude}
          longitude={provider.longitude}
          telephone={provider.phone}
          ndisRegistered={provider.registered}
          description={`${provider.name} — ${service.label} near ${suburbLabel}. Facility-first listing on MapAble Australia.`}
          accessibilityFeatures={{
            wheelchairAccess: provider.supports.includes("In-person"),
          }}
        />
      ))}

      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Programmatic local SEO · Facility-first
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {copy.h1}
        </h1>
        <p className="max-w-3xl text-base text-muted-foreground">{copy.intro}</p>
        <p className="text-sm text-muted-foreground">
          MapAble aggregates brick-and-mortar NDIS providers, accessible transport,
          and employment supports by location and infrastructure — not freelancer
          marketplaces.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/provider-finder"
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open full Provider Finder
          </Link>
          <Link
            href="/care"
            className="inline-flex min-h-11 items-center rounded-lg border border-input bg-background px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            About MapAble Care
          </Link>
        </div>
      </header>

      <DirectoryView
        providers={providers}
        suburbLabel={suburbLabel}
        serviceLabel={service.label}
      />

      <footer className="border-t border-border/60 pt-6 text-sm text-muted-foreground">
        <p>
          Canonical landing:{" "}
          <a
            href={landingUrl}
            className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {landingUrl.replace(/^https?:\/\//, "")}
          </a>
        </p>
      </footer>
    </main>
  );
}
