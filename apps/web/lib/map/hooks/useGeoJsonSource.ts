"use client";

import type maplibregl from "maplibre-gl";
import { useEffect } from "react";

import { getProviderCirclePaint } from "@/lib/map/map-colors";
import type { MapFeatureCollection } from "@/lib/map/types";

/**
 * Add or update a GeoJSON source on a loaded MapLibre map.
 */
export function useGeoJsonSource(
  map: maplibregl.Map | null,
  sourceId: string,
  data: MapFeatureCollection | GeoJSON.FeatureCollection<GeoJSON.Point>,
  layer?: {
    layerId: string;
    paint?: maplibregl.CircleLayerSpecification["paint"];
  },
) {
  useEffect(() => {
    if (!map) return;

    const apply = () => {
      const existing = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
      if (existing) {
        existing.setData(data);
        return;
      }

      map.addSource(sourceId, { type: "geojson", data });
      if (layer && !map.getLayer(layer.layerId)) {
        map.addLayer({
          id: layer.layerId,
          type: "circle",
          source: sourceId,
          paint: layer.paint ?? getProviderCirclePaint(),
        });
      }
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once("load", apply);
    }
  }, [map, sourceId, data, layer]);
}
