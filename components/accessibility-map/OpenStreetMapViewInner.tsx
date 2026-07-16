"use client";

import { Crosshair, List, RotateCcw } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from "react-leaflet";

import { AccessibilityMapMarker } from "@/components/accessibility-map/AccessibilityMapMarker";
import { AccessibilityMapPopup } from "@/components/accessibility-map/AccessibilityMapPopup";
import {
  FitBoundsControl,
  PanToSelectedControl,
  PanToUserLocationControl,
} from "@/components/accessibility-map/FitBoundsControl";
import { MapLegend } from "@/components/accessibility-map/MapLegend";
import {
  createUserLocationIcon,
} from "@/components/accessibility-map/accessibilityMapIcons";
import { UserLocationControl } from "@/components/accessibility-map/UserLocationControl";
import type { UserLocationResult } from "@/hooks/useUserLocation";
import type { AccessNeed } from "@/lib/access-fit/types";
import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";
import {
  AUSTRALIA_FALLBACK_CENTER,
  AUSTRALIA_FALLBACK_ZOOM,
  SINGLE_MARKER_ZOOM,
} from "@/lib/map/accessibilityMapUtils";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import type { LatLngTuple } from "@/lib/map/accessibilityMapUtils";

type OpenStreetMapViewInnerProps = {
  mappable: DemoAccessPlace[];
  markerCoordinates: LatLngTuple[];
  selectedId?: string;
  selectedCoords: LatLngTuple | null;
  onSelect: (id: string) => void;
  activeNeeds: AccessNeed;
  userLocationCoords: LatLngTuple | null;
  userLocationHook: UserLocationResult;
  onResetToResults: () => void;
  onFitToResults: () => void;
  refitTrigger: number;
  onSwitchToList?: () => void;
  onTileError: () => void;
  initialCenter: LatLngTuple;
  initialZoom?: number;
};

export function OpenStreetMapViewInner({
  mappable,
  markerCoordinates,
  selectedId,
  selectedCoords,
  onSelect,
  activeNeeds,
  userLocationCoords,
  userLocationHook,
  onResetToResults,
  onFitToResults,
  refitTrigger,
  onSwitchToList,
  onTileError,
  initialCenter,
  initialZoom,
}: OpenStreetMapViewInnerProps) {
  const userLocationIcon = createUserLocationIcon();

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom ?? (markerCoordinates.length === 1 ? SINGLE_MARKER_ZOOM : AUSTRALIA_FALLBACK_ZOOM)}
      className="access-map-leaflet min-h-[420px] md:min-h-[60vh] lg:min-h-[65vh]"
      scrollWheelZoom
      zoomControl={false}
      keyboard
      aria-label="Accessibility places map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        eventHandlers={{
          tileerror: () => onTileError(),
        }}
      />

      <ZoomControl position="topleft" />

      <FitBoundsControl
        coordinates={markerCoordinates}
        userLocation={userLocationCoords}
        refitTrigger={refitTrigger}
      />
      <PanToSelectedControl selectedCoords={selectedCoords} />
      <PanToUserLocationControl userLocation={userLocationCoords} />

      {mappable.map((place) => (
        <AccessibilityMapMarker
          key={place.id}
          place={place}
          isSelected={selectedId === place.id}
          onSelect={onSelect}
        >
          <Popup closeButton autoPan maxWidth={300} minWidth={220}>
            <AccessibilityMapPopup
              place={place}
              activeNeeds={activeNeeds}
              onViewDetails={onSelect}
            />
          </Popup>
        </AccessibilityMapMarker>
      ))}

      {userLocationCoords ? (
        <Marker position={userLocationCoords} icon={userLocationIcon}>
          <Popup>
            <p className="text-sm font-semibold">Your approximate location</p>
            <p className="mt-1 text-xs text-slate-600">
              This shows your device&apos;s approximate position. It may not be
              exact.
            </p>
          </Popup>
        </Marker>
      ) : null}

      {/* Custom map controls overlay */}
      <div className="access-map-controls pointer-events-none absolute inset-0 z-[1000]">
        <div className="pointer-events-auto absolute right-3 top-3 flex flex-col gap-2">
          <UserLocationControl
            onRequest={userLocationHook.requestLocation}
            isLoading={userLocationHook.isLoading}
            hasLocation={userLocationHook.location !== null}
          />
          <button
            type="button"
            className={`access-map-control flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#005B7F] shadow-sm transition hover:bg-[#F6FBFC] ${mapableCareFocusRing}`}
            onClick={onResetToResults}
            aria-label="Reset map to show all filtered results"
            title="Reset to results"
          >
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`access-map-control flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#005B7F] shadow-sm transition hover:bg-[#F6FBFC] ${mapableCareFocusRing}`}
            onClick={onFitToResults}
            aria-label="Fit map to filtered results"
            title="Fit to results"
          >
            <Crosshair className="h-5 w-5" aria-hidden="true" />
          </button>
          {onSwitchToList ? (
            <button
              type="button"
              className={`access-map-control flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#005B7F] shadow-sm transition hover:bg-[#F6FBFC] lg:hidden ${mapableCareFocusRing}`}
              onClick={onSwitchToList}
              aria-label="Switch to list view"
              title="List view"
            >
              <List className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="pointer-events-auto absolute bottom-8 left-3 hidden sm:block">
          <MapLegend />
        </div>
      </div>
    </MapContainer>
  );
}
