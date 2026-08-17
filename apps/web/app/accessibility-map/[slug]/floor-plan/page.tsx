"use client";

import Link from "next/link";
import { use } from "react";

import { FloorPlanViewer } from "@/components/accessibility-map/floor-plan/FloorPlanViewer";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { getDemoPlaceBySlug } from "@/lib/demo/accessibility-places";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ floor?: string; feature?: string; route?: string; view?: string }>;
};

export default function FloorPlanPage({ params, searchParams }: PageProps) {
  const { slug } = use(params);
  const sp = use(searchParams);
  const place = getDemoPlaceBySlug(slug);

  if (!place) {
    return (
      <MapAbleCareMarketingShell>
        <div className="mx-auto max-w-4xl px-5 py-10">
          <p className="font-semibold">Venue not found.</p>
          <Link href="/accessibility-map" className={`mt-4 inline-block font-semibold text-[#005B7F] underline ${mapableCareFocusRing}`}>
            Back to Accessibility Map
          </Link>
        </div>
      </MapAbleCareMarketingShell>
    );
  }

  if (!place.hasFloorPlan) {
    return (
      <MapAbleCareMarketingShell>
        <div className="mx-auto max-w-4xl px-5 py-10">
          <p className="font-semibold">No public floor plan is currently available for this venue.</p>
          <Link
            href={`/accessibility-map/${slug}`}
            className={`mt-4 inline-block font-semibold text-[#005B7F] underline ${mapableCareFocusRing}`}
          >
            Back to {place.name}
          </Link>
        </div>
      </MapAbleCareMarketingShell>
    );
  }

  return (
    <MapAbleCareMarketingShell>
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <p className="mb-4">
          <Link
            href={`/accessibility-map/${slug}`}
            className={`text-sm font-semibold text-[#005B7F] underline ${mapableCareFocusRing}`}
          >
            ← Back to {place.name}
          </Link>
          {" · "}
          <Link
            href="/accessibility-map"
            className={`text-sm font-semibold text-[#005B7F] underline ${mapableCareFocusRing}`}
          >
            Accessibility Map
          </Link>
        </p>
        <FloorPlanViewer
          venueId={place.id}
          venueName={place.name}
          venueSlug={place.slug}
          initialFloorId={sp.floor}
          initialFeatureId={sp.feature}
          initialRouteId={sp.route}
          initialView={sp.view === "text" ? "text" : "plan"}
          embedded
        />
      </div>
    </MapAbleCareMarketingShell>
  );
}
