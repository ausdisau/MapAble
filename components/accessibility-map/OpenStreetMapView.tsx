"use client";

import L from "leaflet";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";

import type { AccessNeed } from "@/lib/access-fit/types";
import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";
import {
  AUSTRALIA_FALLBACK_CENTER,
  AUSTRALIA_FALLBACK_ZOOM,
  getPlaceCoordinates,
  partitionPlacesByCoordinates,
} from "@/lib/map/accessibilityMapUtils";
import { useUserLocation } from "@/hooks/useUserLocation";

const OpenStreetMapViewInner = dynamic(
  () =>
    import("@/components/accessibility-map/OpenStreetMapViewInner").then(
      (m) => m.OpenStreetMapViewInner,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-[#F6FBFC] md:min-h-[60vh]"
        role="status"
        aria-label="Loading map"
      >
        <p className="text-sm text-slate-600">Loading map…</p>
      </div>
    ),
  },
);

type OpenStreetMapViewProps = {
  places: DemoAccessPlace[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  activeNeeds: AccessNeed;
  onSwitchToList?: () => void;
};

export function OpenStreetMapView({
  places,
  selectedId,
  onSelect,
  activeNeeds,
  onSwitchToList,
}: OpenStreetMapViewProps) {
  const { mappable, missingCoordinates } = useMemo(
    () => partitionPlacesByCoordinates(places),
    [places],
  );

  const userLocationHook = useUserLocation();
  const [tileError, setTileError] = useState(false);
  const [refitTrigger, setRefitTrigger] = useState(0);

  const markerCoordinates = useMemo(
    () =>
      mappable
        .map((p) => getPlaceCoordinates(p))
        .filter((c): c is [number, number] => c !== null),
    [mappable],
  );

  const selectedCoords = useMemo(() => {
    if (!selectedId) return null;
    const place = mappable.find((p) => p.id === selectedId);
    return place ? getPlaceCoordinates(place) : null;
  }, [selectedId, mappable]);

  const userLocationCoords = useMemo(() => {
    if (!userLocationHook.location) return null;
    return [userLocationHook.location.lat, userLocationHook.location.lng] as [
      number,
      number,
    ];
  }, [userLocationHook.location]);

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(selectedId === id ? undefined : id);
    },
    [onSelect, selectedId],
  );

  const handleResetToResults = useCallback(() => {
    onSelect(undefined);
    setRefitTrigger((n) => n + 1);
  }, [onSelect]);

  const handleFitToResults = useCallback(() => {
    setRefitTrigger((n) => n + 1);
  }, []);

  if (places.length === 0) {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-8 text-center"
        role="status"
      >
        <p className="font-semibold text-[#0C1833]">
          No accessibility places match these filters.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Try adjusting your search or clearing some filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="sr-only" id="access-map-guidance">
        Interactive map showing the filtered accessibility locations. Use the List
        view for a fully textual version of these results.
      </p>

      {missingCoordinates.length > 0 ? (
        <p
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950"
          role="status"
        >
          {missingCoordinates.length} filtered place
          {missingCoordinates.length === 1 ? "" : "s"} do not yet have map
          coordinates and {missingCoordinates.length === 1 ? "is" : "are"}{" "}
          available in list view.
        </p>
      ) : null}

      {tileError ? (
        <p
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-900"
          role="alert"
        >
          The map tiles could not be loaded. The accessibility results remain
          available in List view.
        </p>
      ) : null}

      <div
        className="access-map-container relative overflow-hidden rounded-2xl border border-slate-200 focus-within:ring-4 focus-within:ring-[#F8C51C]/40"
        role="region"
        aria-label="Accessibility places map"
        aria-describedby="access-map-guidance"
      >
        <OpenStreetMapViewInner
          mappable={mappable}
          markerCoordinates={markerCoordinates}
          selectedId={selectedId}
          selectedCoords={selectedCoords}
          onSelect={handleSelect}
          activeNeeds={activeNeeds}
          userLocationCoords={userLocationCoords}
          userLocationHook={userLocationHook}
          onResetToResults={handleResetToResults}
          onFitToResults={handleFitToResults}
          refitTrigger={refitTrigger}
          onSwitchToList={onSwitchToList}
          onTileError={() => setTileError(true)}
          initialCenter={
            markerCoordinates.length > 0
              ? markerCoordinates[0]
              : AUSTRALIA_FALLBACK_CENTER
          }
          initialZoom={
            markerCoordinates.length > 0 ? undefined : AUSTRALIA_FALLBACK_ZOOM
          }
        />
      </div>

      {/* Live region for result count announcements */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Showing {mappable.length} place{mappable.length === 1 ? "" : "s"} on the
        map
        {missingCoordinates.length > 0
          ? `, ${missingCoordinates.length} without coordinates`
          : ""}
        .
      </p>

      {/* Live region for user location status */}
      {userLocationHook.message ? (
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {userLocationHook.message}
        </p>
      ) : null}
    </div>
  );
}
