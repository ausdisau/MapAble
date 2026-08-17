import L from "leaflet";

type MapMarkerVariant = "primary" | "secondary" | "destructive";

const MARKER_SIZES: Record<MapMarkerVariant, { size: number; anchor: number }> = {
  primary: { size: 22, anchor: 11 },
  secondary: { size: 20, anchor: 10 },
  destructive: { size: 24, anchor: 12 },
};

/** Leaflet divIcon markers styled via .map-marker* classes in app/index.css. */
export function createMapMarkerIcon(variant: MapMarkerVariant) {
  const { size, anchor } = MARKER_SIZES[variant];
  return L.divIcon({
    className: "",
    html: `<div class="map-marker map-marker--${variant}" style="width:${size}px;height:${size}px" role="presentation" aria-hidden="true"></div>`,
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
  });
}

export const mapMarkerIcons = {
  provider: createMapMarkerIcon("primary"),
  user: createMapMarkerIcon("secondary"),
  selected: createMapMarkerIcon("destructive"),
} as const;
