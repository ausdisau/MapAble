"use client";

import { createContext, useContext, type ReactNode } from "react";

import { getDefaultCenter, getMapAttribution, getMapStyleUrl } from "@/lib/map/map-style";

type MapContextValue = {
  styleUrl: string;
  attribution: string;
  defaultCenter: ReturnType<typeof getDefaultCenter>;
};

const MapContext = createContext<MapContextValue | null>(null);

export function MapProvider({ children }: { children: ReactNode }) {
  return (
    <MapContext.Provider
      value={{
        styleUrl: getMapStyleUrl(),
        attribution: getMapAttribution(),
        defaultCenter: getDefaultCenter(),
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMapConfig() {
  const ctx = useContext(MapContext);
  if (!ctx) {
    return {
      styleUrl: getMapStyleUrl(),
      attribution: getMapAttribution(),
      defaultCenter: getDefaultCenter(),
    };
  }
  return ctx;
}
