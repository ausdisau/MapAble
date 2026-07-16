"use client";

import L from "leaflet";

/** User location marker icon using divIcon. Client-only. */
export function createUserLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div class="access-map-user-marker" role="img" aria-label="Your approximate device location">
      <span class="access-map-user-marker__pulse" aria-hidden="true"></span>
      <span class="access-map-user-marker__dot" aria-hidden="true"></span>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}
