"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AccessFitBadge } from "@/components/access-fit/AccessFitBadge";
import { AccessNeedsTogglePanel } from "@/components/access-fit/AccessNeedsTogglePanel";
import { OpenStreetMapView } from "@/components/accessibility-map/OpenStreetMapView";
import { calculateAccessFit } from "@/lib/access-fit/calculate-access-fit";
import { DEMO_ACCESS_NEEDS, EMPTY_ACCESS_NEEDS } from "@/lib/access-fit/types";
import {
  ACCESS_MAP_FILTERS,
  DEMO_ACCESS_PLACES,
  filterDemoPlaces,
  type DemoAccessPlace,
} from "@/lib/demo/accessibility-places";
import { ACCESS_DISCLAIMER } from "@/lib/access-map/copy";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

const VIEW_STORAGE_KEY = "mapable-accessibility-map-view";

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
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

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

  const handleSelectPlace = useCallback((id: string | undefined) => {
    setSelectedId(id);
  }, []);

  const handleCardSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      if (view === "map") return;
      // Subtle scroll into view when selecting from list — avoid aggressive auto-scroll
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
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
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
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
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
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
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
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
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
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
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
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedFilters.includes(filter.id)}
                      onChange={() => toggleFilter(filter.id)}
                    />
                    <span>{filter.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <div className="space-y-3">
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={useDemoNeeds}
                onChange={(event) => setUseDemoNeeds(event.target.checked)}
              />
              Use demo wheelchair Access-Fit profile
            </label>
            {!useDemoNeeds ? (
              <AccessNeedsTogglePanel needs={needs} onChange={setNeeds} />
            ) : null}
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600" role="status" aria-live="polite">
              Showing {places.length} place{places.length === 1 ? "" : "s"}
            </p>
            <div
              role="group"
              aria-label="Map or list view"
              className="inline-flex rounded-xl border border-slate-300 p-1"
            >
              <button
                type="button"
                className={`min-h-11 rounded-lg px-4 text-sm font-bold ${view === "list" ? "bg-[#005B7F] text-white" : ""} ${mapableCareFocusRing}`}
                aria-pressed={view === "list"}
                onClick={() => handleViewChange("list")}
              >
                List
              </button>
              <button
                type="button"
                className={`min-h-11 rounded-lg px-4 text-sm font-bold ${view === "map" ? "bg-[#005B7F] text-white" : ""} ${mapableCareFocusRing}`}
                aria-pressed={view === "map"}
                onClick={() => handleViewChange("map")}
              >
                Map
              </button>
            </div>
          </div>

          {view === "map" ? (
            <OpenStreetMapView
              places={places}
              selectedId={selectedId}
              onSelect={handleSelectPlace}
              activeNeeds={activeNeeds}
              onSwitchToList={() => handleViewChange("list")}
            />
          ) : null}

          {view === "list" ? (
          <ul className="space-y-4" aria-label="Accessible places">
            {places.map((place) => {
              const fit = calculateAccessFit(activeNeeds, place.profile);
              const isSelected = selectedId === place.id;
              return (
                <li key={place.id}>
                  <article
                    ref={(el) => {
                      cardRefs.current[place.id] = el;
                    }}
                    className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                      isSelected
                        ? "border-[#005B7F] ring-2 ring-[#005B7F]/30"
                        : "border-slate-200"
                    }`}
                    aria-current={isSelected ? "true" : undefined}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-black">{place.name}</h2>
                        <p className="text-sm text-slate-600 capitalize">
                          {place.category.replace(/_/g, " ")} · {place.suburb}, {place.state}
                        </p>
                      </div>
                      <div className="space-y-2 text-right">
                        <p className="text-sm font-bold">
                          Access score {place.accessScore} · {place.tier}
                        </p>
                        <p className="text-xs text-slate-600">
                          Confidence: {place.confidence} · Last checked {place.lastChecked}
                        </p>
                        <p className="text-xs text-slate-600">Source: {place.source} · Demo data</p>
                      </div>
                    </div>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {place.topAccessFacts.map((fact) => (
                        <li
                          key={fact}
                          className="rounded-full bg-[#F6FBFC] px-3 py-1 text-xs font-semibold text-[#005B7F]"
                        >
                          {fact}
                        </li>
                      ))}
                    </ul>
                    {place.keyBarrier ? (
                      <p className="mt-3 text-sm text-amber-900">
                        Key barrier: {place.keyBarrier}
                      </p>
                    ) : null}
                    <div className="mt-3">
                      <AccessFitBadge score={fit.score} label={fit.label} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/accessibility-map/${place.slug}`}
                        className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableCareFocusRing}`}
                      >
                        View access details
                      </Link>
                      <button
                        type="button"
                        className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
                        onClick={() => {
                          handleCardSelect(place.id);
                          handleViewChange("map");
                        }}
                        aria-label={`Show ${place.name} on map`}
                      >
                        Show on map
                      </button>
                      <Link
                        href={`/journey-planner?destination=${encodeURIComponent(place.name)}`}
                        className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
                      >
                        Plan trip
                      </Link>
                      <Link
                        href={`/add-access-info?place=${encodeURIComponent(place.name)}`}
                        className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
                      >
                        Report update
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
          ) : null}

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
                className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableCareFocusRing}`}
              >
                Add place
              </Link>
              <Link
                href="/add-access-info"
                className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-black ${mapableCareFocusRing}`}
              >
                Update access info
              </Link>
              <Link
                href="/mapping-days"
                className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-black ${mapableCareFocusRing}`}
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
            <Link href="/access" className="font-semibold text-[#005B7F] underline">
              Open /access
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
