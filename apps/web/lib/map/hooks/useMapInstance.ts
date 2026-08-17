"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useState, type RefObject } from "react";

export type MapInstanceConfig = {
  styleUrl: string;
  center: { lat: number; lng: number; zoom: number };
};

/**
 * Create and tear down a MapLibre map on a container ref.
 */
export function useMapInstance(
  containerRef: RefObject<HTMLDivElement | null>,
  config: MapInstanceConfig,
): maplibregl.Map | null {
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: config.styleUrl,
      center: [config.center.lng, config.center.lat],
      zoom: config.center.zoom,
      attributionControl: {},
    });

    instance.addControl(new maplibregl.NavigationControl(), "top-left");
    setMap(instance);

    return () => {
      instance.remove();
      setMap(null);
    };
  }, [containerRef, config.styleUrl, config.center.lat, config.center.lng, config.center.zoom]);

  return map;
}
