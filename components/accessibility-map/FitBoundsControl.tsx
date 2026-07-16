"use client";

import { latLngBounds } from "leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

import {
  AUSTRALIA_FALLBACK_CENTER,
  AUSTRALIA_FALLBACK_ZOOM,
  SINGLE_MARKER_ZOOM,
  coordinatesKey,
  prefersReducedMotion,
  type LatLngTuple,
} from "@/lib/map/accessibilityMapUtils";

type FitBoundsControlProps = {
  coordinates: LatLngTuple[];
  userLocation?: LatLngTuple | null;
  /** Increment to force a re-fit without coordinate changes */
  refitTrigger?: number;
};

/**
 * Fits map bounds when the filtered coordinate set changes.
 * Does not continuously reset while the user is panning.
 */
export function FitBoundsControl({ coordinates, userLocation, refitTrigger = 0 }: FitBoundsControlProps) {
  const map = useMap();
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    const allCoords = userLocation ? [...coordinates, userLocation] : coordinates;
    const key = `${coordinatesKey(allCoords)}::${refitTrigger}`;

    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    const reducedMotion = prefersReducedMotion();

    if (allCoords.length === 0) {
      map.setView(AUSTRALIA_FALLBACK_CENTER, AUSTRALIA_FALLBACK_ZOOM, {
        animate: !reducedMotion,
      });
      return;
    }

    if (allCoords.length === 1) {
      map.setView(allCoords[0], SINGLE_MARKER_ZOOM, {
        animate: !reducedMotion,
      });
      return;
    }

    const bounds = latLngBounds(allCoords);
    map.fitBounds(bounds, {
      padding: [60, 60],
      maxZoom: 15,
      animate: !reducedMotion,
    });
  }, [map, coordinates, userLocation, refitTrigger]);

  return null;
}

/**
 * Pans to a selected place when selection changes (without resetting all bounds).
 */
export function PanToSelectedControl({
  selectedCoords,
}: {
  selectedCoords: LatLngTuple | null;
}) {
  const map = useMap();
  const lastSelectedRef = useRef<string>("");

  useEffect(() => {
    if (!selectedCoords) return;
    const key = `${selectedCoords[0]},${selectedCoords[1]}`;
    if (key === lastSelectedRef.current) return;
    lastSelectedRef.current = key;

    const reducedMotion = prefersReducedMotion();
    const currentZoom = map.getZoom();
    const targetZoom = Math.max(currentZoom, SINGLE_MARKER_ZOOM);

    map.setView(selectedCoords, targetZoom, {
      animate: !reducedMotion,
    });
  }, [map, selectedCoords]);

  return null;
}

/**
 * Pans to user location after a successful geolocation request.
 */
export function PanToUserLocationControl({
  userLocation,
}: {
  userLocation: LatLngTuple | null;
}) {
  const map = useMap();
  const lastLocationRef = useRef<string>("");

  useEffect(() => {
    if (!userLocation) return;
    const key = `${userLocation[0]},${userLocation[1]}`;
    if (key === lastLocationRef.current) return;
    lastLocationRef.current = key;

    const reducedMotion = prefersReducedMotion();
    map.setView(userLocation, Math.max(map.getZoom(), 13), {
      animate: !reducedMotion,
    });
  }, [map, userLocation]);

  return null;
}
