"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { AccessFilterPanel } from "@/components/access/AccessFilterPanel";
import { AccessMap } from "@/components/access/AccessMap";
import { AccessPlaceList } from "@/components/access/AccessPlaceList";
import { AccessSearchBar } from "@/components/access/AccessSearchBar";
import { MobileAccessMapShell } from "@/components/access/MobileAccessMapShell";
import { ACCESS_DISCLAIMER } from "@/lib/access-map/copy";

export type AccessPlaceView = {
  id: string;
  name: string;
  category: string;
  suburb?: string | null;
  reviewCount?: number;
  latitude?: number;
  longitude?: number;
};

export function MapAbleAccessShell({
  initialPlaces,
}: {
  initialPlaces: AccessPlaceView[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [places, setPlaces] = useState(initialPlaces);
  const [view, setView] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const search = useCallback(async () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    const res = await fetch(`/api/access/search?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setPlaces(
      data.results.map(
        (r: {
          place: {
            id: string;
            name: string;
            category: string;
            suburb?: string;
            reviewCount: number;
            latitude?: number;
            longitude?: number;
          };
        }) => ({
          id: r.place.id,
          name: r.place.name,
          category: r.place.category,
          suburb: r.place.suburb,
          reviewCount: r.place.reviewCount,
          latitude: r.place.latitude,
          longitude: r.place.longitude,
        })
      )
    );
  }, [query, category]);

  const skipCategorySearchOnMount = useRef(true);
  useEffect(() => {
    if (skipCategorySearchOnMount.current) {
      skipCategorySearchOnMount.current = false;
      return;
    }
    void search();
    // Re-run when category changes; query updates use the search bar submit handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- category filter only
  }, [category]);

  const mapPlaces = places
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.id,
      name: p.name,
      latitude: p.latitude!,
      longitude: p.longitude!,
    }));

  return (
    <MobileAccessMapShell view={view} onViewChange={setView}>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <header>
          <h1 className="mapable-display text-3xl font-black tracking-[-0.04em] text-[#0C1833]">
            MapAble Access
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Public accessibility map with community reviews and optional MapAble
            Accreditation. This venue has user-reported accessibility information
            where shown.
          </p>
        </header>

        <AccessSearchBar value={query} onChange={setQuery} onSubmit={search} />

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <AccessFilterPanel category={category} onCategoryChange={setCategory} />
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`min-h-11 rounded-xl px-4 font-black ${view === "list" ? "bg-[#005B7F] text-white" : "border border-slate-200 bg-white text-[#0C1833]"}`}
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
              >
                List view
              </button>
              <button
                type="button"
                className={`min-h-11 rounded-xl px-4 font-black ${view === "map" ? "bg-[#005B7F] text-white" : "border border-slate-200 bg-white text-[#0C1833]"}`}
                onClick={() => setView("map")}
                aria-pressed={view === "map"}
              >
                Map view
              </button>
            </div>

            {view === "map" ? (
              <AccessMap
                places={mapPlaces}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ) : null}

            <AccessPlaceList places={places} />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{ACCESS_DISCLAIMER}</p>
        <noscript>
          <p className="text-sm text-slate-700">
            List view and place links work without interactive map scripts. Map view is an
            optional enhancement.
          </p>
        </noscript>
        <p className="text-sm">
          Prefer the competitor map landing?{" "}
          <Link href="/accessibility-map" className="font-semibold text-[#005B7F] underline">
            Open Accessibility Map
          </Link>
          .
        </p>
      </div>
    </MobileAccessMapShell>
  );
}
