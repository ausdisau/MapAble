import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { MapFeature, MapLayer, PersonalPlace } from "./types";

export interface MapViewHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  getBboxString: () => string | undefined;
  getBboxArray: () => number[] | undefined;
}

interface MapViewProps {
  layers: MapLayer[];
  features: MapFeature[];
  visibleLayerIds: Set<string>;
  personalPlaces?: PersonalPlace[];
  onFeatureClick?: (feature: MapFeature) => void;
  onMoveEnd?: (bbox: string) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
  highlightFeatureId?: string | null;
}

const AUS_CENTER: [number, number] = [-33.8688, 151.2093]; // Sydney default

function colorForLayer(layer?: MapLayer): string {
  return layer?.color || "#1B6EB5";
}

function makeDivIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "mapable-pin",
    html: `<span style="display:block;width:16px;height:16px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 16],
    popupAnchor: [0, -16],
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function popupHtml(f: MapFeature, layer?: MapLayer): string {
  const attrs = f.attributes || {};
  const rows = Object.entries(attrs)
    .filter(([k, v]) => !k.startsWith("_") && v != null && String(v).trim() !== "" && String(v).length < 200)
    .slice(0, 8)
    .map(([k, v]) => `<div style="display:flex;gap:6px;font-size:12px;margin-top:2px"><strong style="color:#555">${escapeHtml(k)}:</strong><span>${escapeHtml(String(v))}</span></div>`)
    .join("");
  return `<div style="min-width:180px;max-width:260px" role="group" aria-label="${escapeHtml(f.name)}">
    <div style="font-weight:700;font-size:14px;color:#14578F">${escapeHtml(f.name)}</div>
    ${layer ? `<div style="font-size:11px;color:#888;margin-top:1px">${escapeHtml(layer.name)}</div>` : ""}
    ${f.description ? `<div style="font-size:12px;margin-top:4px">${escapeHtml(f.description)}</div>` : ""}
    ${rows}
  </div>`;
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any>(null);
  const lineLayerRef = useRef<L.LayerGroup | null>(null);
  const personalLayerRef = useRef<L.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, zoom = 15) => {
      mapRef.current?.flyTo([lat, lng], zoom, { duration: 0.8 });
    },
    getBboxString: () => {
      const b = mapRef.current?.getBounds();
      if (!b) return undefined;
      return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(",");
    },
    getBboxArray: () => {
      const b = mapRef.current?.getBounds();
      if (!b) return undefined;
      return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    },
  }));

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: props.center || AUS_CENTER,
      zoom: props.zoom || 12,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const cluster = (L as any).markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50 });
    map.addLayer(cluster);
    clusterRef.current = cluster;
    lineLayerRef.current = L.layerGroup().addTo(map);
    personalLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setReady(true);

    map.on("moveend", () => {
      const b = map.getBounds();
      props.onMoveEnd?.([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(","));
    });

    setTimeout(() => map.invalidateSize(), 100);
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render features
  useEffect(() => {
    if (!ready || !clusterRef.current || !lineLayerRef.current) return;
    const layerById = new Map(props.layers.map((l) => [l.id, l]));
    clusterRef.current.clearLayers();
    lineLayerRef.current.clearLayers();

    const markers: L.Marker[] = [];
    for (const f of props.features) {
      if (!props.visibleLayerIds.has(f.layerId)) continue;
      const layer = layerById.get(f.layerId);
      const geomType = f.geometry?.type;

      if (geomType === "Point") {
        const [lng, lat] = f.geometry.coordinates as [number, number];
        if (typeof lat !== "number" || typeof lng !== "number") continue;
        const marker = L.marker([lat, lng], { icon: makeDivIcon(colorForLayer(layer)), title: f.name, alt: f.name });
        marker.bindPopup(popupHtml(f, layer));
        if (props.onFeatureClick) marker.on("click", () => props.onFeatureClick!(f));
        markers.push(marker);
      } else if (geomType === "LineString") {
        const coords = (f.geometry.coordinates as number[][]).map(([lng, lat]) => [lat, lng] as [number, number]);
        const color = (f.attributes?._color as string) || colorForLayer(layer);
        const line = L.polyline(coords, { color, weight: 4, opacity: 0.8 });
        line.bindPopup(popupHtml(f, layer));
        if (props.onFeatureClick) line.on("click", () => props.onFeatureClick!(f));
        line.addTo(lineLayerRef.current!);
      } else if (geomType === "Polygon" || geomType === "MultiPolygon") {
        try {
          const gj = L.geoJSON(f.geometry as any, { style: { color: colorForLayer(layer), weight: 2, fillOpacity: 0.1 } });
          gj.bindPopup(popupHtml(f, layer));
          gj.addTo(lineLayerRef.current!);
        } catch { /* skip malformed */ }
      }
    }
    if (markers.length) clusterRef.current.addLayers(markers);
  }, [ready, props.features, props.visibleLayerIds, props.layers, props.onFeatureClick]);

  // Render personal places
  useEffect(() => {
    if (!ready || !personalLayerRef.current) return;
    personalLayerRef.current.clearLayers();
    for (const p of props.personalPlaces || []) {
      const lat = Number(p.lat), lng = Number(p.lng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
      const marker = L.marker([lat, lng], { icon: makeDivIcon("#E6A817"), title: p.name, alt: p.name });
      marker.bindPopup(`<div style="font-weight:700;color:#E6A817">${escapeHtml(p.name)}</div>${p.address ? `<div style="font-size:12px">${escapeHtml(p.address)}</div>` : ""}`);
      marker.addTo(personalLayerRef.current!);
    }
  }, [ready, props.personalPlaces]);

  // Highlight + fly to a feature
  useEffect(() => {
    if (!ready || !props.highlightFeatureId) return;
    const f = props.features.find((x) => x.id === props.highlightFeatureId);
    if (f?.lat && f?.lng) {
      mapRef.current?.flyTo([Number(f.lat), Number(f.lng)], 16, { duration: 0.8 });
    }
  }, [ready, props.highlightFeatureId, props.features]);

  return <div ref={containerRef} className={props.className} style={{ height: "100%", width: "100%" }} data-testid="map-view" role="application" aria-label="Interactive accessibility map" />;
});
