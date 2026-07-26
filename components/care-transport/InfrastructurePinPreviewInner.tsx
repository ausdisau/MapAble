"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { mapMarkerIcons } from "@/lib/map/leaflet-markers";
import "@/lib/map/leaflet-icons";

const tileUrl =
  process.env.NEXT_PUBLIC_OSM_TILE_URL ??
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const attribution =
  process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ?? "© OpenStreetMap contributors";

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14);
  }, [map, lat, lng]);
  return null;
}

type Props = {
  latitude: number;
  longitude: number;
  label?: string;
};

export function InfrastructurePinPreviewInner({
  latitude,
  longitude,
  label,
}: Props) {
  return (
    <div className="space-y-1">
      <div
        className="h-48 overflow-hidden rounded-lg border"
        role="img"
        aria-label={
          label
            ? `Map preview for ${label}`
            : `Map preview at ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        }
      >
        <MapContainer
          center={[latitude, longitude]}
          zoom={14}
          className="h-full w-full"
          scrollWheelZoom={false}
          dragging
        >
          <TileLayer attribution={attribution} url={tileUrl} />
          <Marker
            position={[latitude, longitude]}
            icon={mapMarkerIcons.provider}
          />
          <Recenter lat={latitude} lng={longitude} />
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        Preview pin: {latitude.toFixed(5)}, {longitude.toFixed(5)} · {attribution}
      </p>
    </div>
  );
}
