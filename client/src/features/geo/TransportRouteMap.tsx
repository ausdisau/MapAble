import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { geoApi } from "./api";
import { MapView } from "./MapView";
import type { MapFeature, MapLayer } from "./types";

/**
 * Compact map preview for a transport trip: geocodes pickup + dropoff,
 * renders both points plus a connecting line. Rendered on demand so we
 * don't geocode every history row at once.
 */
export function TransportRouteMap({ pickup, dropoff }: { pickup: string; dropoff: string }) {
  const [from, setFrom] = useState<{ lat: number; lng: number } | null>(null);
  const [to, setTo] = useState<{ lat: number; lng: number } | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    (async () => {
      try {
        const [p, d] = await Promise.all([geoApi.geocode(pickup), geoApi.geocode(dropoff)]);
        if (cancelled) return;
        setFrom(p[0] ? { lat: p[0].lat, lng: p[0].lng } : null);
        setTo(d[0] ? { lat: d[0].lat, lng: d[0].lng } : null);
        setState(p[0] || d[0] ? "ready" : "error");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => { cancelled = true; };
  }, [pickup, dropoff]);

  const layers: MapLayer[] = useMemo(() => [
    { id: "trip-pts", slug: "trip-pts", name: "Stops", domains: ["transport"], visibility: "public", geometryType: "Point", defaultVisible: true, ordering: 1, color: "#1B6EB5" },
    { id: "trip-line", slug: "trip-line", name: "Route", domains: ["transport"], visibility: "public", geometryType: "LineString", defaultVisible: true, ordering: 2, color: "#E6A817" },
  ], []);

  const features: MapFeature[] = useMemo(() => {
    const feats: MapFeature[] = [];
    if (from) feats.push({ id: "trip-from", layerId: "trip-pts", name: `Pickup: ${pickup}`, geometry: { type: "Point", coordinates: [from.lng, from.lat] } });
    if (to) feats.push({ id: "trip-to", layerId: "trip-pts", name: `Dropoff: ${dropoff}`, geometry: { type: "Point", coordinates: [to.lng, to.lat] } });
    if (from && to) feats.push({ id: "trip-route", layerId: "trip-line", name: "Route", geometry: { type: "LineString", coordinates: [[from.lng, from.lat], [to.lng, to.lat]] } });
    return feats;
  }, [from, to, pickup, dropoff]);

  const visibleLayerIds = useMemo(() => new Set(["trip-pts", "trip-line"]), []);
  const center = useMemo<[number, number] | undefined>(() => {
    if (from && to) return [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2];
    if (from) return [from.lat, from.lng];
    if (to) return [to.lat, to.lng];
    return undefined;
  }, [from, to]);

  if (state === "loading") {
    return <div className="h-40 flex items-center justify-center text-muted-foreground rounded-md border mt-2" data-testid="status-route-loading"><Loader2 className="w-4 h-4 animate-spin" /></div>;
  }
  if (state === "error") {
    return <div className="h-12 flex items-center justify-center text-xs text-muted-foreground rounded-md border mt-2" data-testid="status-route-error">Couldn't map this route.</div>;
  }

  return (
    <div className="h-40 rounded-md overflow-hidden border mt-2" data-testid="transport-route-map">
      <MapView layers={layers} features={features} visibleLayerIds={visibleLayerIds} center={center} zoom={10} />
    </div>
  );
}
