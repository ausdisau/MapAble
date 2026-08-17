export function getMapStyleUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
    "https://demotiles.maplibre.org/style.json"
  );
}

export function getMapAttribution(): string {
  return (
    process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ??
    "© OpenStreetMap contributors"
  );
}

export function getDefaultCenter(): { lat: number; lng: number; zoom: number } {
  return {
    lat: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LAT ?? "-33.8688"),
    lng: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LNG ?? "151.2093"),
    zoom: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM ?? "10"),
  };
}
