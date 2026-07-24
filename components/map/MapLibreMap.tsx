"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { MapAccessibleResultsList } from "@/components/map/MapAccessibleResultsList";
import { MapFullscreenToggle } from "@/components/map/MapFullscreenToggle";
import { useMapConfig } from "@/components/map/MapProvider";
import { useGeoJsonSource } from "@/lib/map/hooks/useGeoJsonSource";
import { useMapInstance } from "@/lib/map/hooks/useMapInstance";
import { providersToGeoJSON } from "@/lib/map/map-feature-query";
import { MAP_LAYER_IDS, MAP_SOURCE_IDS } from "@/lib/map/map-layer-ids";

export type MapLibreProvider = {
  id: string;
  name: string;
  suburb: string;
  state: string;
  lat: number;
  lng: number;
  distanceKm?: number | null;
};

type MapLibreMapProps = {
  providers: MapLibreProvider[];
  userPosition?: { lat: number; lng: number } | null;
  onProviderSelect?: (id: string) => void;
  selectedProviderId?: string | null;
};

export function MapLibreMap({
  providers,
  userPosition,
  onProviderSelect,
  selectedProviderId,
}: MapLibreMapProps) {
  const mapId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const { styleUrl, attribution, defaultCenter } = useMapConfig();
  const [expanded, setExpanded] = useState(false);

  const map = useMapInstance(containerRef, {
    styleUrl,
    center: defaultCenter,
  });

  const geoJson = useMemo(
    () =>
      providersToGeoJSON(
        providers.map((p) => ({
          id: p.id,
          name: p.name,
          lat: p.lat,
          lng: p.lng,
          suburb: p.suburb,
          state: p.state,
        })),
      ),
    [providers],
  );

  useGeoJsonSource(map, MAP_SOURCE_IDS.providers, geoJson, {
    layerId: MAP_LAYER_IDS.providers,
  });

  useEffect(() => {
    if (!map || !userPosition) return;
    map.flyTo({ center: [userPosition.lng, userPosition.lat], zoom: 12 });
  }, [map, userPosition]);

  const listResults = providers.slice(0, 50).map((p) => ({
    id: p.id,
    name: p.name,
    subtitle: `${p.suburb}, ${p.state}`,
    distanceLabel:
      p.distanceKm != null ? `${p.distanceKm.toFixed(1)} km away` : undefined,
  }));

  return (
    <div
      className={`relative flex flex-col gap-3 ${expanded ? "fixed inset-0 z-50 bg-background p-4" : ""}`}
    >
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {providers.length} provider pin{providers.length === 1 ? "" : "s"} on the map
        {selectedProviderId ? `. Selected provider ${selectedProviderId}.` : "."}
      </p>
      <div
        id={`map-region-${mapId}`}
        ref={containerRef}
        className={`w-full rounded-lg border ${expanded ? "min-h-[70vh] flex-1" : "h-[400px]"}`}
        role="application"
        aria-label="Provider finder map"
      />
      <MapFullscreenToggle
        expanded={expanded}
        onToggle={() => setExpanded((e) => !e)}
        controlsId={`map-region-${mapId}`}
      />
      <p className="text-xs text-muted-foreground">{attribution}</p>
      <MapAccessibleResultsList
        results={listResults}
        selectedId={selectedProviderId}
        onSelect={onProviderSelect}
      />
    </div>
  );
}
