/**
 * Heuristic map actions for care_transport_map Ask context.
 * Keeps behaviour deterministic without requiring the interpreter in tests.
 */

import type { CareTransportMapAction } from "@/lib/copilot/types";

export type { CareTransportMapAction };

/** Approximate centroids for common AU suburbs used in pilot prompts. */
const PLACE_HINTS: Array<{
  match: RegExp;
  lat: number;
  lng: number;
  label: string;
}> = [
  {
    match: /\bparramatta\b/i,
    lat: -33.8151,
    lng: 151.0011,
    label: "Parramatta NSW",
  },
  {
    match: /\bsydney\b/i,
    lat: -33.8688,
    lng: 151.2093,
    label: "Sydney NSW",
  },
  {
    match: /\bmelbourne\b/i,
    lat: -37.8136,
    lng: 144.9631,
    label: "Melbourne VIC",
  },
  {
    match: /\bbrisbane\b/i,
    lat: -27.4698,
    lng: 153.0251,
    label: "Brisbane QLD",
  },
  {
    match: /\bnewcastle\b/i,
    lat: -32.9283,
    lng: 151.7817,
    label: "Newcastle NSW",
  },
  {
    match: /\bst\s*ives\b/i,
    lat: -33.7297,
    lng: 151.1664,
    label: "St Ives NSW",
  },
];

export function planCareTransportMapActions(query: string): {
  mapActions: CareTransportMapAction[];
  answer: string;
  summary: string;
} {
  const q = query.trim();
  const mapActions: CareTransportMapAction[] = [];
  const layers = new Set<"careProviders" | "infrastructure" | "trips">();

  const wantsCare =
    /\b(care|support\s*worker|ndis|provider|ot|physio)\b/i.test(q);
  const wantsInfra =
    /\b(infrastructure|hub|depot|pickup|station|toilet|drop[- ]?off)\b/i.test(
      q,
    );
  const wantsTrips = /\b(my\s*trip|trips?|pickup|drop[- ]?off|journey)\b/i.test(
    q,
  );
  const wantsAdd =
    /\b(add|suggest|submit|report)\b/i.test(q) &&
    /\b(place|infrastructure|hub|depot|pickup)\b/i.test(q);

  if (wantsCare || (!wantsInfra && !wantsTrips && !wantsAdd)) {
    layers.add("careProviders");
  }
  if (wantsInfra || wantsAdd) {
    layers.add("infrastructure");
  }
  if (wantsTrips) {
    layers.add("trips");
  }

  if (layers.size > 0) {
    mapActions.push({ type: "setLayers", layers: [...layers] });
  }

  for (const hint of PLACE_HINTS) {
    if (hint.match.test(q)) {
      mapActions.push({
        type: "flyTo",
        lat: hint.lat,
        lng: hint.lng,
        zoom: 12,
        label: hint.label,
      });
      break;
    }
  }

  if (wantsAdd) {
    mapActions.push({
      type: "suggestInfrastructure",
      href: "/add-infrastructure",
      prompt: q,
    });
  }

  const placeLabel =
    mapActions.find((a) => a.type === "flyTo")?.label ?? "your area";
  const layerNames = [...layers].join(", ") || "care providers";

  return {
    mapActions,
    summary: `Map focus: ${layerNames}`,
    answer: wantsAdd
      ? `I can help you suggest moderated Care or Transport infrastructure near ${placeLabel}. Review the draft on Add infrastructure — nothing is published to OpenStreetMap automatically.`
      : `Showing ${layerNames} near ${placeLabel}. This is a pilot discovery map: pins are not live ETAs, and trip addresses stay masked for privacy. Route estimates remain advisory.`,
  };
}
