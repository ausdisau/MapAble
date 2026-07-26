"use client";

import Link from "next/link";

import { AccessFitBadge } from "@/components/access-fit/AccessFitBadge";
import { ViewFloorPlanButton } from "@/components/accessibility-map/floor-plan/ViewFloorPlanButton";
import { calculateAccessFit } from "@/lib/access/fit/calculate-access-fit";
import type { AccessNeed } from "@/lib/access/fit/types";
import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type AccessibilityMapPopupProps = {
  place: DemoAccessPlace;
  activeNeeds: AccessNeed;
  onViewDetails?: (id: string) => void;
};

export function AccessibilityMapPopup({
  place,
  activeNeeds,
  onViewDetails,
}: AccessibilityMapPopupProps) {
  const fit = calculateAccessFit(activeNeeds, place.profile);

  return (
    <div className="access-map-popup min-w-[220px] max-w-[280px] text-sm text-[#0C1833]">
      <h3 className="text-base font-black leading-tight">{place.name}</h3>
      <p className="mt-0.5 capitalize text-slate-600">
        {place.category.replace(/_/g, " ")} · {place.suburb}, {place.state}
      </p>

      <dl className="mt-2 space-y-1">
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold">Access score:</dt>
          <dd>
            {place.accessScore} · {place.tier}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold">Confidence:</dt>
          <dd className="capitalize">{place.confidence}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold">Last checked:</dt>
          <dd>{place.lastChecked}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold">Source:</dt>
          <dd>{place.source}</dd>
        </div>
      </dl>

      {place.topAccessFacts.length > 0 ? (
        <ul className="mt-2 space-y-0.5" aria-label="Key accessibility features">
          {place.topAccessFacts.slice(0, 3).map((fact) => (
            <li key={fact} className="flex items-start gap-1.5 text-xs">
              <span aria-hidden="true" className="mt-0.5 text-[#00A979]">
                ✓
              </span>
              {fact}
            </li>
          ))}
        </ul>
      ) : null}

      {place.keyBarrier ? (
        <p className="mt-2 text-xs text-amber-900">
          <span className="font-semibold">Key barrier:</span> {place.keyBarrier}
        </p>
      ) : null}

      <div className="mt-2">
        <AccessFitBadge score={fit.score} label={fit.label} />
      </div>

      <div className="mt-3 space-y-2">
        <Link
          href={`/accessibility-map/${place.slug}`}
          className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#005B7F] px-3 text-xs font-black text-white ${mapableCareFocusRing}`}
          onClick={() => onViewDetails?.(place.id)}
        >
          View accessibility details
        </Link>
        <ViewFloorPlanButton
          venueId={place.id}
          venueName={place.name}
          venueSlug={place.slug}
          className="w-full justify-center text-xs"
        />
      </div>
    </div>
  );
}
