import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { geoApi } from "./api";
import { MapView, type MapViewHandle } from "./MapView";
import { evaluateCoverage } from "./geofence";
import type { MapFeature, MapLayer, WorkerCoverageZone } from "./types";

/**
 * Shown to carers on a job/transport detail: geocodes the location string,
 * compares it against the worker's saved coverage radius and surfaces an
 * in-area / out-of-area notice plus a small map preview.
 */
export function JobCoverageNotice({ location }: { location: string }) {
  const mapRef = useRef<MapViewHandle>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<"loading" | "found" | "notfound" | "error">("loading");

  const { data: zone } = useQuery<WorkerCoverageZone | null>({
    queryKey: ["/api/geo/worker-coverage"],
    queryFn: () => geoApi.getWorkerCoverage(),
  });

  useEffect(() => {
    let cancelled = false;
    setGeoState("loading");
    setCoords(null);
    (async () => {
      try {
        const results = await geoApi.geocode(location);
        if (cancelled) return;
        if (results[0]) {
          setCoords({ lat: results[0].lat, lng: results[0].lng });
          setGeoState("found");
        } else {
          setGeoState("notfound");
        }
      } catch {
        if (!cancelled) setGeoState("error");
      }
    })();
    return () => { cancelled = true; };
  }, [location]);

  const result = useMemo(
    () => (coords ? evaluateCoverage(zone, coords.lat, coords.lng) : null),
    [zone, coords],
  );

  const previewLayers: MapLayer[] = useMemo(() => [
    { id: "job-loc", slug: "job-loc", name: "Job", domains: ["employment"], visibility: "public", geometryType: "Point", defaultVisible: true, ordering: 1, color: "#1B6EB5" },
    { id: "coverage", slug: "coverage", name: "Coverage", domains: ["care"], visibility: "public", geometryType: "Polygon", defaultVisible: true, ordering: 2, color: "#2EAA6E" },
  ], []);

  const previewFeatures: MapFeature[] = useMemo(() => {
    const feats: MapFeature[] = [];
    if (coords) {
      feats.push({ id: "job-point", layerId: "job-loc", name: location, geometry: { type: "Point", coordinates: [coords.lng, coords.lat] } });
    }
    if (zone?.centerLat && zone?.centerLng && zone?.radiusKm) {
      const cLat = Number(zone.centerLat), cLng = Number(zone.centerLng), radius = Number(zone.radiusKm);
      if (!Number.isNaN(cLat) && !Number.isNaN(cLng) && radius > 0) {
        const points: number[][] = [];
        const latRad = (cLat * Math.PI) / 180;
        for (let i = 0; i <= 48; i++) {
          const theta = (i / 48) * 2 * Math.PI;
          points.push([cLng + (radius / (111 * Math.cos(latRad))) * Math.sin(theta), cLat + (radius / 111) * Math.cos(theta)]);
        }
        feats.push({ id: "coverage-circle", layerId: "coverage", name: "Your coverage", geometry: { type: "Polygon", coordinates: [points] } });
      }
    }
    return feats;
  }, [coords, zone, location]);

  const visibleLayerIds = useMemo(() => new Set(["job-loc", "coverage"]), []);

  return (
    <Card className="p-4 space-y-3" data-testid="card-job-coverage">
      <h3 className="font-bold text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-[#1B6EB5]" /> Coverage check</h3>

      {geoState === "loading" && (
        <div className="text-sm text-muted-foreground flex items-center gap-2" data-testid="status-coverage-loading"><Loader2 className="w-4 h-4 animate-spin" /> Locating job…</div>
      )}
      {geoState === "notfound" && (
        <div className="text-sm text-muted-foreground" data-testid="status-coverage-notfound">Couldn't place “{location}” on the map.</div>
      )}
      {geoState === "error" && (
        <div className="text-sm text-muted-foreground" data-testid="status-coverage-error">Location lookup unavailable right now.</div>
      )}

      {geoState === "found" && result && (
        <>
          {!result.evaluated ? (
            <div className="flex items-start gap-2 text-sm rounded-md bg-muted p-2" data-testid="notice-coverage-none">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>Set your service coverage area in your profile to check whether this job is in range.</span>
            </div>
          ) : result.inside ? (
            <div className="flex items-start gap-2 text-sm rounded-md bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 p-2" data-testid="notice-coverage-inside">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>In your coverage area — about {result.distanceKm!.toFixed(1)} km from your center (radius {result.radiusKm} km).</span>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-sm rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 p-2" data-testid="notice-coverage-outside">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Outside your coverage area — about {result.distanceKm!.toFixed(1)} km away (radius {result.radiusKm} km).</span>
            </div>
          )}

          <div className="h-40 rounded-md overflow-hidden border" data-testid="coverage-job-map">
            <MapView
              ref={mapRef}
              layers={previewLayers}
              features={previewFeatures}
              visibleLayerIds={visibleLayerIds}
              center={coords ? [coords.lat, coords.lng] : undefined}
              zoom={11}
            />
          </div>
        </>
      )}
    </Card>
  );
}
