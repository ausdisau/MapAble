"use client";

import Link from "next/link";
import { forwardRef } from "react";

import { cn } from "@/app/lib/utils";
import {
  AccessDataSourceMarker,
  resolveAccessDataSourceKind,
} from "@/components/access/AccessDataSourceMarker";
import { AccessFitBadge } from "@/components/access-fit/AccessFitBadge";
import { ViewFloorPlanButton } from "@/components/accessibility-map/floor-plan/ViewFloorPlanButton";
import { calculateAccessFit } from "@/lib/access-fit/calculate-access-fit";
import type { AccessNeed } from "@/lib/access-fit/types";
import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";
import {
  mapableCareFocusRing,
  mapableInteractiveFocusRing,
} from "@/lib/marketing/mapable-care-tokens";

export type VenueListCardProps = {
  place: DemoAccessPlace;
  activeNeeds: AccessNeed;
  isSelected?: boolean;
  onShowOnMap?: (id: string) => void;
  className?: string;
};

/**
 * Accessible venue result card used for list view and map error fallbacks.
 */
export const VenueListCard = forwardRef<HTMLElement, VenueListCardProps>(
  function VenueListCard(
    { place, activeNeeds, isSelected = false, onShowOnMap, className },
    ref,
  ) {
    const fit = calculateAccessFit(activeNeeds, place.profile);
    const sourceKind = resolveAccessDataSourceKind({
      isDemo: place.isDemo,
      source: place.source,
      tier: place.tier,
    });

    return (
      <article
        ref={ref}
        className={cn(
          "rounded-2xl border bg-white p-5 shadow-sm transition",
          isSelected
            ? "border-[#005B7F] ring-2 ring-[#005B7F]/30"
            : "border-slate-200",
          className,
        )}
        aria-current={isSelected ? "true" : undefined}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">{place.name}</h2>
            <p className="text-sm capitalize text-slate-600">
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
            <AccessDataSourceMarker
              kind={sourceKind}
              className="ml-auto max-w-xs text-left"
            />
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
            className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableInteractiveFocusRing}`}
          >
            View access details
          </Link>
          {place.hasFloorPlan ? (
            <ViewFloorPlanButton
              venueId={place.id}
              venueName={place.name}
              venueSlug={place.slug}
            />
          ) : null}
          {onShowOnMap ? (
            <button
              type="button"
              className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
              onClick={() => onShowOnMap(place.id)}
              aria-label={`Show ${place.name} on map`}
            >
              Show on map
            </button>
          ) : null}
          <Link
            href={`/journey-planner?destination=${encodeURIComponent(place.name)}`}
            className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableInteractiveFocusRing}`}
          >
            Plan trip
          </Link>
          <Link
            href={`/add-access-info?place=${encodeURIComponent(place.name)}`}
            className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableInteractiveFocusRing}`}
          >
            Report update
          </Link>
        </div>
      </article>
    );
  },
);
