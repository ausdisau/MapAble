"use client";

import type maplibregl from "maplibre-gl";
import { useMemo } from "react";

import { useGeoJsonSource } from "@/lib/map/hooks/useGeoJsonSource";
import { getInfrastructureCirclePaint } from "@/lib/map/map-colors";
import { MAP_LAYER_IDS, MAP_SOURCE_IDS } from "@/lib/map/map-layer-ids";
import type { MapFeatureCollection } from "@/lib/map/types";

function emptyCollection(): MapFeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

type Props = {
  map: maplibregl.Map | null;
  data: MapFeatureCollection;
  visible: boolean;
};

/**
 * MapLibre GeoJSON layer for foundational (non-NDIS) community supports.
 */
export function FoundationalSupportsLayer({ map, data, visible }: Props) {
  const empty = useMemo(() => emptyCollection(), []);
  useGeoJsonSource(
    map,
    MAP_SOURCE_IDS.foundationalSupports,
    visible ? data : empty,
    {
      layerId: MAP_LAYER_IDS.foundationalSupports,
      paint: {
        ...getInfrastructureCirclePaint(),
        "circle-radius": 6,
        "circle-opacity": 0.9,
      },
    }
  );
  return null;
}
