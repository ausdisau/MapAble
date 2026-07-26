"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { FoundationalSupportsLayer } from "@/components/map/FoundationalSupportsLayer";
import { MapAccessibleResultsList } from "@/components/map/MapAccessibleResultsList";
import { MapFullscreenToggle } from "@/components/map/MapFullscreenToggle";
import { useMapConfig } from "@/components/map/MapProvider";
import { useGeoJsonSource } from "@/lib/map/hooks/useGeoJsonSource";
import { useMapInstance } from "@/lib/map/hooks/useMapInstance";
import {
  getInfrastructureCirclePaint,
  getProviderCirclePaint,
  getTripPointCirclePaint,
} from "@/lib/map/map-colors";
import { MAP_LAYER_IDS, MAP_SOURCE_IDS } from "@/lib/map/map-layer-ids";
import type { MapFeatureCollection } from "@/lib/map/types";

export type CareTransportLayerKey =
  | "careProviders"
  | "infrastructure"
  | "trips"
  | "foundationalSupports";

type Props = {
  careProviders: MapFeatureCollection;
  infrastructure: MapFeatureCollection;
  trips: MapFeatureCollection | null;
  foundationalSupports?: MapFeatureCollection | null;
  layers: Record<CareTransportLayerKey, boolean>;
  flyTo?: { lat: number; lng: number; zoom?: number } | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** When false, omit the accessible list (parent already renders directory HTML). */
  showResultsList?: boolean;
};

function emptyCollection(): MapFeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

export function CareTransportMapView({
  careProviders,
  infrastructure,
  trips,
  foundationalSupports = null,
  layers,
  flyTo,
  selectedId,
  onSelect,
  showResultsList = true,
}: Props) {
  const mapId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const { styleUrl, attribution, defaultCenter } = useMapConfig();
  const [expanded, setExpanded] = useState(false);

  const map = useMapInstance(containerRef, {
    styleUrl,
    center: defaultCenter,
  });

  const careData = layers.careProviders ? careProviders : emptyCollection();
  const infraData = layers.infrastructure ? infrastructure : emptyCollection();
  const tripData =
    layers.trips && trips ? trips : emptyCollection();
  const foundationalData = foundationalSupports ?? emptyCollection();

  useGeoJsonSource(map, MAP_SOURCE_IDS.careProviders, careData, {
    layerId: MAP_LAYER_IDS.careProviders,
    paint: getProviderCirclePaint(),
  });
  useGeoJsonSource(map, MAP_SOURCE_IDS.infrastructure, infraData, {
    layerId: MAP_LAYER_IDS.infrastructure,
    paint: getInfrastructureCirclePaint(),
  });
  useGeoJsonSource(map, MAP_SOURCE_IDS.transportTrips, tripData, {
    layerId: MAP_LAYER_IDS.transportTrips,
    paint: getTripPointCirclePaint(),
  });

  useEffect(() => {
    if (!map || !flyTo) return;
    map.flyTo({
      center: [flyTo.lng, flyTo.lat],
      zoom: flyTo.zoom ?? 12,
    });
  }, [map, flyTo]);

  const listResults = useMemo(() => {
    const rows: Array<{
      id: string;
      name: string;
      subtitle?: string;
    }> = [];
    if (layers.careProviders) {
      for (const f of careProviders.features) {
        rows.push({
          id: String(f.properties.id),
          name: f.properties.name,
          subtitle: f.properties.subtitle,
        });
      }
    }
    if (layers.infrastructure) {
      for (const f of infrastructure.features) {
        rows.push({
          id: String(f.properties.id),
          name: f.properties.name,
          subtitle: f.properties.subtitle,
        });
      }
    }
    if (layers.trips && trips) {
      for (const f of trips.features) {
        rows.push({
          id: String(f.properties.id),
          name: f.properties.name,
          subtitle: f.properties.subtitle,
        });
      }
    }
    if (layers.foundationalSupports && foundationalSupports) {
      for (const f of foundationalSupports.features) {
        rows.push({
          id: String(f.properties.id),
          name: f.properties.name,
          subtitle: f.properties.subtitle ?? "foundational_support",
        });
      }
    }
    return rows.slice(0, 50);
  }, [
    careProviders,
    infrastructure,
    trips,
    foundationalSupports,
    layers,
  ]);

  const pinCount = listResults.length;

  const handleSelect = useCallback(
    (id: string) => {
      onSelect?.(id);
      if (!map) return;
      const all = [
        ...(layers.careProviders ? careProviders.features : []),
        ...(layers.infrastructure ? infrastructure.features : []),
        ...(layers.trips && trips ? trips.features : []),
        ...(layers.foundationalSupports && foundationalSupports
          ? foundationalSupports.features
          : []),
      ];
      const hit = all.find((f) => String(f.properties.id) === id);
      const coords = hit?.geometry?.coordinates;
      if (coords) {
        map.flyTo({ center: [coords[0], coords[1]], zoom: 14 });
      }
    },
    [
      map,
      onSelect,
      careProviders,
      infrastructure,
      trips,
      foundationalSupports,
      layers,
    ],
  );

  return (
    <div
      className={`relative flex flex-col gap-3 ${expanded ? "fixed inset-0 z-50 bg-background p-4" : ""}`}
    >
      <FoundationalSupportsLayer
        map={map}
        data={foundationalData}
        visible={Boolean(layers.foundationalSupports)}
      />
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {pinCount} map result{pinCount === 1 ? "" : "s"}
        {selectedId ? `. Selected ${selectedId}.` : "."}
      </p>
      <div
        id={`map-region-${mapId}`}
        ref={containerRef}
        className={`w-full rounded-lg border ${expanded ? "min-h-[70vh] flex-1" : "h-[420px]"}`}
        role="application"
        aria-label="Care and Transport map"
      />
      <MapFullscreenToggle
        expanded={expanded}
        onToggle={() => setExpanded((e) => !e)}
        controlsId={`map-region-${mapId}`}
      />
      <p className="text-xs text-muted-foreground">{attribution}</p>
      {showResultsList ? (
        <MapAccessibleResultsList
          results={listResults}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      ) : null}
    </div>
  );
}
