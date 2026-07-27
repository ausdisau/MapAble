import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Search, Save, Radius } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { geoApi } from "./api";
import { MapView, type MapViewHandle } from "./MapView";
import type { MapFeature, MapLayer, WorkerCoverageZone } from "./types";

/**
 * Worker coverage editor (radius mode): geocode a center suburb/address,
 * set a service radius in km, preview the coverage circle on the map and save.
 */
export function CoverageEditor() {
  const { toast } = useToast();
  const mapRef = useRef<MapViewHandle>(null);

  const { data: zone, isLoading } = useQuery<WorkerCoverageZone | null>({
    queryKey: ["/api/geo/worker-coverage"],
    queryFn: () => geoApi.getWorkerCoverage(),
  });

  const [centerQuery, setCenterQuery] = useState("");
  const [centerLat, setCenterLat] = useState<number | null>(null);
  const [centerLng, setCenterLng] = useState<number | null>(null);
  const [radiusKm, setRadiusKm] = useState("15");
  const [maxTravelMins, setMaxTravelMins] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!zone) return;
    if (zone.centerLat) setCenterLat(Number(zone.centerLat));
    if (zone.centerLng) setCenterLng(Number(zone.centerLng));
    if (zone.radiusKm) setRadiusKm(String(zone.radiusKm));
    if (zone.maxTravelMins != null) setMaxTravelMins(String(zone.maxTravelMins));
  }, [zone]);

  const geocodeCenter = async () => {
    if (!centerQuery.trim()) return;
    setGeocoding(true);
    try {
      const results = await geoApi.geocode(centerQuery.trim());
      if (results[0]) {
        setCenterLat(results[0].lat);
        setCenterLng(results[0].lng);
        mapRef.current?.flyTo(results[0].lat, results[0].lng, 11);
      } else {
        toast({ title: "Not found", description: "No match for that location.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Lookup failed", description: "Could not geocode that location.", variant: "destructive" });
    } finally {
      setGeocoding(false);
    }
  };

  const save = async () => {
    if (centerLat == null || centerLng == null) {
      toast({ title: "Set a center", description: "Search for a suburb or address first.", variant: "destructive" });
      return;
    }
    const radius = Number(radiusKm);
    if (Number.isNaN(radius) || radius <= 0) {
      toast({ title: "Invalid radius", description: "Enter a radius greater than 0 km.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await geoApi.saveWorkerCoverage({
        mode: "radius",
        centerLat: String(centerLat),
        centerLng: String(centerLng),
        radiusKm: String(radius),
        maxTravelMins: maxTravelMins ? Number(maxTravelMins) : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/geo/worker-coverage"] });
      toast({ title: "Coverage saved", description: `${radius} km around your service center.` });
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Represent the coverage circle as a polygon feature for the map preview
  const previewLayers: MapLayer[] = useMemo(() => [{
    id: "coverage-preview", slug: "coverage-preview", name: "Coverage", domains: ["care"],
    visibility: "public", geometryType: "Polygon", defaultVisible: true, ordering: 1, color: "#2EAA6E",
  }], []);

  const previewFeatures: MapFeature[] = useMemo(() => {
    if (centerLat == null || centerLng == null) return [];
    const radius = Number(radiusKm);
    if (Number.isNaN(radius) || radius <= 0) return [];
    const points: number[][] = [];
    const steps = 48;
    const latRad = (centerLat * Math.PI) / 180;
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * 2 * Math.PI;
      const dLat = (radius / 111) * Math.cos(theta);
      const dLng = (radius / (111 * Math.cos(latRad))) * Math.sin(theta);
      points.push([centerLng + dLng, centerLat + dLat]);
    }
    return [{
      id: "coverage-circle", layerId: "coverage-preview", name: "Your coverage area",
      geometry: { type: "Polygon", coordinates: [points] },
    }];
  }, [centerLat, centerLng, radiusKm]);

  const visibleLayerIds = useMemo(() => new Set(["coverage-preview"]), []);

  return (
    <Card data-testid="card-coverage-editor">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Radius className="w-4 h-4 text-[#2EAA6E]" /> Service Coverage Area</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Set the area you cover so jobs and transport requests outside your range can be flagged.</p>

        <div className="space-y-1">
          <Label htmlFor="coverage-center">Service center (suburb or address)</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="coverage-center"
                value={centerQuery}
                onChange={(e) => setCenterQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); geocodeCenter(); } }}
                placeholder="e.g. Parramatta NSW"
                className="pl-9"
                data-testid="input-coverage-center"
              />
            </div>
            <Button type="button" variant="secondary" onClick={geocodeCenter} disabled={geocoding} data-testid="button-geocode-center">
              {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Find"}
            </Button>
          </div>
          {centerLat != null && centerLng != null && (
            <p className="text-xs text-muted-foreground flex items-center gap-1" data-testid="text-coverage-center">
              <MapPin className="w-3 h-3 text-[#2EAA6E]" /> {centerLat.toFixed(4)}, {centerLng.toFixed(4)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="coverage-radius">Radius (km)</Label>
            <Input id="coverage-radius" type="number" min="1" step="1" value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} data-testid="input-coverage-radius" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="coverage-mins">Max travel (mins, optional)</Label>
            <Input id="coverage-mins" type="number" min="0" step="5" value={maxTravelMins} onChange={(e) => setMaxTravelMins(e.target.value)} data-testid="input-coverage-mins" />
          </div>
        </div>

        <div className="h-64 rounded-md overflow-hidden border" data-testid="coverage-map-preview">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : (
            <MapView
              ref={mapRef}
              layers={previewLayers}
              features={previewFeatures}
              visibleLayerIds={visibleLayerIds}
              center={centerLat != null && centerLng != null ? [centerLat, centerLng] : undefined}
              zoom={10}
            />
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} data-testid="button-save-coverage">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save coverage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
