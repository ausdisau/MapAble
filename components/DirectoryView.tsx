"use client";

import { List, Map as MapIcon, Star } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useId, useState } from "react";

import { cn } from "@/app/lib/utils";
import type { Provider } from "@/app/provider-finder/providers";
import { MapErrorBoundary } from "@/components/error/MapErrorBoundary";
import { SearchResultCardSkeleton } from "@/components/ui/skeleton";

export type DirectoryViewMode = "list" | "map";

type DirectoryViewProps = {
  providers: Provider[];
  suburbLabel: string;
  serviceLabel: string;
  className?: string;
};

const DirectoryMap = dynamic(
  () =>
    import("@/components/map/MapLibreMap").then((mod) => ({
      default: mod.MapLibreMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[400px] items-center justify-center rounded-xl border border-border/60 bg-muted/20"
        role="status"
        aria-label="Loading interactive map"
      >
        <SearchResultCardSkeleton />
      </div>
    ),
  },
);

/**
 * List-first directory for programmatic local SEO landings.
 * SSR HTML list ships in the initial document for FCP; MapLibre loads only
 * after the user chooses Map view (keyboard and pointer supported).
 */
export function DirectoryView({
  providers,
  suburbLabel,
  serviceLabel,
  className,
}: DirectoryViewProps) {
  const [view, setView] = useState<DirectoryViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const panelId = useId().replace(/:/g, "");
  const resultsPanelId = `directory-results-${panelId}`;

  const mapProviders = providers
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.id,
      name: p.name,
      suburb: p.suburb,
      state: p.state,
      lat: p.latitude as number,
      lng: p.longitude as number,
      distanceKm: p.distanceKm,
    }));

  return (
    <section className={cn("space-y-4", className)} aria-label="Provider directory">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          {view === "list"
            ? `List view showing ${providers.length} provider${providers.length === 1 ? "" : "s"} for ${serviceLabel} near ${suburbLabel}.`
            : `Map view for ${serviceLabel} near ${suburbLabel}.`}
        </p>
        <div
          role="group"
          aria-label="Directory display mode"
          className="inline-flex rounded-xl border border-border/70 bg-background p-1"
        >
          <button
            type="button"
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted/60",
            )}
            aria-pressed={view === "list"}
            aria-controls={resultsPanelId}
            aria-label={`Show ${serviceLabel} providers near ${suburbLabel} as a list`}
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" aria-hidden />
            List
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              view === "map"
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted/60",
            )}
            aria-pressed={view === "map"}
            aria-controls={resultsPanelId}
            aria-label={`Show ${serviceLabel} providers near ${suburbLabel} on a map`}
            onClick={() => setView("map")}
          >
            <MapIcon className="h-4 w-4" aria-hidden />
            Map
          </button>
        </div>
      </div>

      <div id={resultsPanelId} className="space-y-4">
        {view === "map" ? (
          <div
            className="min-h-[400px] overflow-hidden rounded-xl border border-border/60 shadow-sm"
            aria-label={`Interactive map of ${serviceLabel} near ${suburbLabel}`}
          >
            <MapErrorBoundary
              fallback={
                <ul className="space-y-3 p-4" aria-label="Provider list fallback">
                  {providers.slice(0, 8).map((provider) => (
                    <li key={provider.id}>
                      <Link
                        href={`/jonathan/profile/${encodeURIComponent(provider.slug)}`}
                        className="block rounded-lg border border-border/60 px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {provider.name} — {provider.suburb}, {provider.state}
                      </Link>
                    </li>
                  ))}
                </ul>
              }
            >
              {mapProviders.length > 0 ? (
                <DirectoryMap
                  providers={mapProviders}
                  selectedProviderId={selectedId}
                  onProviderSelect={setSelectedId}
                />
              ) : (
                <p className="p-6 text-sm text-muted-foreground" role="status">
                  Map pins are unavailable for these listings. Use the list below —
                  it does not require map scripts.
                </p>
              )}
            </MapErrorBoundary>
          </div>
        ) : null}

        {/* Lightweight SSR HTML list — always in the document for FCP / crawlers. */}
        <ul className="space-y-3">
          {providers.length === 0 ? (
            <li className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
              No exact matches yet for {serviceLabel} in {suburbLabel}.{" "}
              <Link
                href="/provider-finder"
                className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Open Provider Finder
              </Link>
            </li>
          ) : (
            providers.map((provider) => {
              const rating = Math.max(0, Math.min(5, provider.rating));
              const selected = selectedId === provider.id;
              return (
                <li key={provider.id}>
                  <article
                    className={cn(
                      "rounded-xl border border-border/60 bg-card p-4 shadow-sm transition",
                      selected && "border-primary/40 ring-2 ring-primary/15",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-heading text-lg font-semibold text-foreground">
                          <Link
                            href={`/jonathan/profile/${encodeURIComponent(provider.slug)}`}
                            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {provider.name}
                          </Link>
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {provider.categories[0] ?? serviceLabel} ·{" "}
                          {provider.suburb}, {provider.state}
                          {provider.registered ? " · NDIS registered" : ""}
                        </p>
                      </div>
                      <p className="inline-flex items-center gap-1 text-sm">
                        <Star
                          className="h-4 w-4 fill-amber-400 text-amber-400"
                          aria-hidden
                        />
                        <span className="font-semibold">{rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({provider.reviewCount} reviews)
                        </span>
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-pressed={selected}
                        aria-label={`Highlight ${provider.name} in the directory`}
                        onClick={() =>
                          setSelectedId((prev) =>
                            prev === provider.id ? null : provider.id,
                          )
                        }
                      >
                        {selected ? "Selected" : "Select"}
                      </button>
                      <Link
                        href={`/jonathan/profile/${encodeURIComponent(provider.slug)}`}
                        className="inline-flex min-h-11 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`View profile for ${provider.name}`}
                      >
                        View profile
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <noscript>
        <p className="text-sm text-muted-foreground">
          Provider list results work without JavaScript. The interactive map is an
          optional enhancement.
        </p>
      </noscript>
    </section>
  );
}
