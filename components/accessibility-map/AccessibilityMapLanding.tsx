"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LiveRegion } from "@/components/a11y/LiveRegion";
import { AccessNeedsTogglePanel } from "@/components/access-fit/AccessNeedsTogglePanel";
import { VenueListCard } from "@/components/accessibility-map/VenueListCard";
import { MapErrorBoundary } from "@/components/error/MapErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { DEMO_ACCESS_NEEDS, EMPTY_ACCESS_NEEDS } from "@/lib/access-fit/types";
import { ACCESS_DISCLAIMER } from "@/lib/access-map/copy";
import {
  ACCESS_MAP_FILTERS,
  DEMO_ACCESS_PLACES,
  filterDemoPlaces,
  type DemoAccessPlace,
} from "@/lib/demo/accessibility-places";
import {
  mapableCareFocusRing,
  mapableInteractiveFocusRing,
} from "@/lib/marketing/mapable-care-tokens";
import { toPublicVenueSpec } from "@/lib/offline/public-venue-dto";
import { saveVenueSearchCache } from "@/lib/offline/venue-search-cache";

const VIEW_STORAGE_KEY = "mapable-accessibility-map-view";
const RESULTS_PANEL_ID = "access-map-results-panel";

const OpenStreetMapView = dynamic(
  () =>
    import("@/components/accessibility-map/OpenStreetMapView").then((m) => ({
      default: m.OpenStreetMapView,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[420px] rounded-2xl border border-slate-200 bg-[#F6FBFC] p-4 md:min-h-[60vh]"
        role="status"
        aria-label="Loading map"
      >
        <Skeleton className="h-full min-h-[388px] w-full" />
      </div>
    ),
  },
);

export function AccessibilityMapLanding({
  initialPlaces = DEMO_ACCESS_PLACES,
}: {
  initialPlaces?: DemoAccessPlace[];
}) {
  const [location, setLocation] = useState("");
  const [placeType, setPlaceType] = useState("");
  const [verification, setVerification] = useState("");
  const [transportOption, setTransportOption] = useState("");
  const [query, setQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [view, setView] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [needs, setNeeds] = useState(EMPTY_ACCESS_NEEDS);
  const [useDemoNeeds, setUseDemoNeeds] = useState(false);
  const [mapPinStatus, setMapPinStatus] = useState("");
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const online = useOnlineStatus();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === "list" || stored === "map") {
        setView(stored);
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  const handleViewChange = useCallback((next: "list" | "map") => {
    setView(next);
    try {
      sessionStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  const places = useMemo(() => {
    const filters = [...selectedFilters];
    if (transportOption === "bookable") filters.push("transport-bookable");
    if (transportOption === "nearby") filters.push("pt-nearby");
    if (verification === "verified") filters.push("verified");

    return filterDemoPlaces(initialPlaces, {
      query: [query, placeType].filter(Boolean).join(" "),
      suburb: location,
      filters,
    });
  }, [
    initialPlaces,
    location,
    placeType,
    query,
    selectedFilters,
    transportOption,
    verification,
  ]);

  const activeNeeds = useDemoNeeds ? DEMO_ACCESS_NEEDS : needs;

  // Persist latest public venue specs for offline review (IndexedDB).
  useEffect(() => {
    if (!online || places.length === 0) return;
    const searchQuery = [query, placeType, location, ...selectedFilters]
      .filter(Boolean)
      .join(" ");
    void saveVenueSearchCache({
      query: searchQuery || "all",
      cachedAt: new Date().toISOString(),
      venues: places.map(toPublicVenueSpec),
    }).catch(() => {
      // IndexedDB optional — ignore failures
    });

    // Warm the SW/API cache when online.
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (location) params.set("suburb", location);
    if (selectedFilters.length) params.set("filters", selectedFilters.join(","));
    void fetch(`/api/venues/search?${params.toString()}`).catch(() => {
      // best-effort prefetch
    });
  }, [online, places, query, placeType, location, selectedFilters]);

  useEffect(() => {
    setMapPinStatus(
      view === "map"
        ? `Map view active with ${places.length} place${places.length === 1 ? "" : "s"}.`
        : `List view showing ${places.length} place${places.length === 1 ? "" : "s"}.`,
    );
  }, [view, places.length]);

  const handleSelectPlace = useCallback((id: string | undefined) => {
    setSelectedId(id);
  }, []);

  const handleCardSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      if (view === "map") return;
      const el = cardRefs.current[id];
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    },
    [view],
  );

  function toggleFilter(id: string) {
    setSelectedFilters((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  const listFallback = (
    <ul className="mt-4 space-y-4" aria-label="Accessible places list fallback">
      {places.map((place) => (
        <li key={place.id}>
          <VenueListCard
            place={place}
            activeNeeds={activeNeeds}
            isSelected={selectedId === place.id}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="bg-white text-[#0C1833]">
      <section className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
            Accessibility Map
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.045em] md:text-6xl">
            Know before you go.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Search accessible places with practical details, confidence levels, photos,
            measurements, and transport/support options.
          </p>
          <p className="mt-3 text-sm font-semibold text-amber-900">
            Places below include clearly labelled demo data while live coverage grows.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[20rem_1fr] lg:px-8">
        <aside className="space-y-4" aria-label="Search and filters">
          <form
            className="space-y-4 rounded-2xl border border-slate-200 p-4"
            onSubmit={(event) => event.preventDefault()}
          >
            <div>
              <label htmlFor="access-location" className="text-sm font-semibold">
                Location
              </label>
              <input
                id="access-location"
                className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableInteractiveFocusRing}`}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Suburb or city"
              />
            </div>
            <div>
              <label htmlFor="access-query" className="text-sm font-semibold">
                Place search
              </label>
              <input
                id="access-query"
                className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableInteractiveFocusRing}`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cafe, library, toilet…"
              />
            </div>
            <div>
              <label htmlFor="access-place-type" className="text-sm font-semibold">
                Place type
              </label>
              <select
                id="access-place-type"
                className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableInteractiveFocusRing}`}
                value={placeType}
                onChange={(event) => setPlaceType(event.target.value)}
              >
                <option value="">Any type</option>
                <option value="library">Library</option>
                <option value="cafe">Cafe / restaurant</option>
                <option value="toilet">Public toilet</option>
                <option value="gallery">Gallery / venue</option>
              </select>
            </div>
            <div>
              <label htmlFor="access-verification" className="text-sm font-semibold">
                Verification status
              </label>
              <select
                id="access-verification"
                className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableInteractiveFocusRing}`}
                value={verification}
                onChange={(event) => setVerification(event.target.value)}
              >
                <option value="">Any status</option>
                <option value="verified">MapAble verified / accredited</option>
              </select>
            </div>
            <div>
              <label htmlFor="access-transport" className="text-sm font-semibold">
                Transport options
              </label>
              <select
                id="access-transport"
                className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableInteractiveFocusRing}`}
                value={transportOption}
                onChange={(event) => setTransportOption(event.target.value)}
              >
                <option value="">Any</option>
                <option value="nearby">Public transport nearby</option>
                <option value="bookable">Transport bookable</option>
              </select>
            </div>
          </form>

          <fieldset className="rounded-2xl border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold">Access filters</legend>
            <ul className="mt-2 space-y-2">
              {ACCESS_MAP_FILTERS.map((filter) => (
                <li key={filter.id}>
                  <label
                    className={`flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm ${mapableInteractiveFocusRing}`}
                  >
                    <input
                      type="checkbox"
                      className={mapableInteractiveFocusRing}
                      checked={selectedFilters.includes(filter.id)}
                      onChange={() => toggleFilter(filter.id)}
                      aria-controls={RESULTS_PANEL_ID}
                    />
                    <span>{filter.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <div className="space-y-3">
            <label
              className={`flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-semibold ${mapableInteractiveFocusRing}`}
            >
              <input
                type="checkbox"
                className={mapableInteractiveFocusRing}
                checked={useDemoNeeds}
                onChange={(event) => setUseDemoNeeds(event.target.checked)}
                aria-controls="access-needs-panel"
              />
              Use demo wheelchair Access-Fit profile
            </label>
            {!useDemoNeeds ? (
              <div id="access-needs-panel">
                <AccessNeedsTogglePanel needs={needs} onChange={setNeeds} />
              </div>
            ) : null}
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600" role="status" aria-live="polite">
              Showing {places.length} place{places.length === 1 ? "" : "s"}
              {selectedFilters.length > 0
                ? ` · ${selectedFilters.length} filter${selectedFilters.length === 1 ? "" : "s"} on`
                : ""}
            </p>
            <div
              role="group"
              aria-label="Map or list view"
              className="inline-flex rounded-xl border border-slate-300 p-1"
            >
              <button
                type="button"
                className={`min-h-11 rounded-lg px-4 text-sm font-bold ${view === "list" ? "bg-[#005B7F] text-white" : ""} ${mapableInteractiveFocusRing}`}
                aria-pressed={view === "list"}
                aria-controls={RESULTS_PANEL_ID}
                aria-expanded={view === "list"}
                onClick={() => handleViewChange("list")}
              >
                List
              </button>
              <button
                type="button"
                className={`min-h-11 rounded-lg px-4 text-sm font-bold ${view === "map" ? "bg-[#005B7F] text-white" : ""} ${mapableInteractiveFocusRing}`}
                aria-pressed={view === "map"}
                aria-controls={RESULTS_PANEL_ID}
                aria-expanded={view === "map"}
                onClick={() => handleViewChange("map")}
              >
                Map
              </button>
            </div>
          </div>

          <LiveRegion message={mapPinStatus} id="access-map-view-live" />

          {/* Stable min-height avoids CLS when map scripts load/fail or view toggles */}
          <div
            id={RESULTS_PANEL_ID}
            className="min-h-[420px] md:min-h-[60vh]"
            aria-live="polite"
            aria-busy={false}
          >
            {view === "map" ? (
              <MapErrorBoundary
                fallback={
                  <div>
                    <button
                      type="button"
                      className={`min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black ${mapableCareFocusRing}`}
                      onClick={() => handleViewChange("list")}
                    >
                      Switch to list view
                    </button>
                    {listFallback}
                  </div>
                }
              >
                <OpenStreetMapView
                  places={places}
                  selectedId={selectedId}
                  onSelect={handleSelectPlace}
                  activeNeeds={activeNeeds}
                  onSwitchToList={() => handleViewChange("list")}
                />
              </MapErrorBoundary>
            ) : null}

            {view === "list" ? (
              <ul className="space-y-4" aria-label="Accessible places">
                {places.map((place) => (
                  <li key={place.id}>
                    <VenueListCard
                      ref={(el) => {
                        cardRefs.current[place.id] = el;
                      }}
                      place={place}
                      activeNeeds={activeNeeds}
                      isSelected={selectedId === place.id}
                      onShowOnMap={(id) => {
                        handleCardSelect(id);
                        handleViewChange("map");
                      }}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <section
            aria-labelledby="help-map-heading"
            className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-6"
          >
            <h2 id="help-map-heading" className="text-2xl font-black">
              Help map this area.
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Missing access details? Add what you know, or join a community mapping day.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/add-access-info"
                className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableInteractiveFocusRing}`}
              >
                Add place
              </Link>
              <Link
                href="/add-access-info"
                className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-black ${mapableInteractiveFocusRing}`}
              >
                Update access info
              </Link>
              <Link
                href="/mapping-days"
                className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-black ${mapableInteractiveFocusRing}`}
              >
                Join mapping day
              </Link>
            </div>
          </section>

          <p className="text-sm text-slate-600" role="note">
            Access information can change. Confirm critical access needs before travelling.
            {` ${ACCESS_DISCLAIMER}`}
          </p>

          <p className="text-sm">
            Looking for the operational map shell?{" "}
            <Link
              href="/access"
              className={`font-semibold text-[#005B7F] underline ${mapableInteractiveFocusRing}`}
            >
              Open /access
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
