import Link from "next/link";
import React from "react";

import { DEMO_ACCESS_PLACES } from "@/lib/demo/accessibility-places";
import { homepageMapPreviewFilters } from "@/lib/marketing/mapable-care-combined-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function HomepageMapPreview() {
  const previewPlaces = DEMO_ACCESS_PLACES.slice(0, 3);

  return (
    <section
      id="map-preview"
      aria-labelledby="map-preview-heading"
      className="border-y border-slate-200 bg-[#F6FBFC]"
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-16">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
            Accessibility map preview
          </p>
          <h2
            id="map-preview-heading"
            className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#0C1833] md:text-4xl"
          >
            Know before you go, with practical filters.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Search by access needs that people actually use. List view works without map
            scripts. Demo places are labelled until live coverage expands.
          </p>
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-[#0C1833]">Preview filters</legend>
            <ul className="mt-3 flex flex-wrap gap-2">
              {homepageMapPreviewFilters.map((filter) => (
                <li
                  key={filter}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  {filter}
                </li>
              ))}
            </ul>
          </fieldset>
          <Link
            href="/accessibility-map"
            className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#005B7F] px-5 text-sm font-black text-white ${mapableCareFocusRing}`}
          >
            Open accessibility map
          </Link>
        </div>
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">
            Demo data
          </p>
          <ul className="mt-4 space-y-3" aria-label="Sample accessible places">
            {previewPlaces.map((place) => (
              <li key={place.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-[#0C1833]">{place.name}</h3>
                    <p className="text-sm text-slate-600">
                      {place.category.replace(/_/g, " ")} · {place.suburb}
                    </p>
                  </div>
                  <p className="rounded-full bg-[#F6FBFC] px-3 py-1 text-xs font-bold text-[#005B7F]">
                    {place.tier} · score {place.accessScore}
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {place.topAccessFacts[0]}
                  {place.keyBarrier ? ` · Barrier: ${place.keyBarrier}` : ""}
                </p>
                <Link
                  href={`/accessibility-map/${place.slug}`}
                  className={`mt-3 inline-flex min-h-11 items-center text-sm font-black text-[#005B7F] underline-offset-2 hover:underline ${mapableCareFocusRing}`}
                >
                  View access details
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
