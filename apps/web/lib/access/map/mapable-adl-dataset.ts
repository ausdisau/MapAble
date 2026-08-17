import { readFile } from "fs/promises";
import path from "path";

import type { PlaceAccessProfile } from "@/lib/access/fit/types";
import {
  MAPABLE_ADL_DATASET_PUBLIC_PATH,
  MAPABLE_ADL_SOURCE_LABEL,
  MAPABLE_MY_MAPS_KML_URL,
} from "@/lib/access/map/copy";
import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";

export type MapableAdlCompactPlace = {
  id: string;
  slug: string;
  name: string;
  layer: string;
  category: string;
  lat: number;
  lng: number;
  fact: string;
  desc?: string;
};

export type MapableAdlDataset = {
  source: string;
  sourceUrl: string;
  attribution: string;
  generatedAt: string;
  count: number;
  places: MapableAdlCompactPlace[];
};

const EMPTY_PROFILE: PlaceAccessProfile = {
  stepFreeEntry: null,
  doorWidthMm: null,
  internalStepFree: null,
  accessibleToilet: null,
  accessibleParking: null,
  dropOffPoint: null,
  lowSensoryOption: null,
  hearingLoop: null,
  staffTraining: null,
  assistanceAnimalWelcome: null,
  publicTransportNearby: null,
  transportBookable: null,
  lastVerified: null,
  confidence: "unknown",
};

let cachedDataset: MapableAdlDataset | null | undefined;
let cachedPlaces: DemoAccessPlace[] | null | undefined;

function profileForLayer(layer: string): PlaceAccessProfile {
  const base = { ...EMPTY_PROFILE };
  const key = layer.toLowerCase();
  if (key.includes("toilet")) {
    return {
      ...base,
      accessibleToilet: true,
      confidence: "low",
      lastVerified: null,
    };
  }
  if (key.includes("mobility_parking") || key.includes("parking")) {
    return {
      ...base,
      accessibleParking: true,
      confidence: "low",
      lastVerified: null,
    };
  }
  if (key.includes("playground")) {
    return {
      ...base,
      stepFreeEntry: true,
      confidence: "low",
      lastVerified: null,
    };
  }
  if (key === "stairs") {
    return {
      ...base,
      stepFreeEntry: false,
      confidence: "low",
      lastVerified: null,
    };
  }
  return base;
}

function suburbFromCoords(lat: number, lng: number): string {
  // Lightweight AU region hint for list cards (not a geocoder).
  if (lat < -10 && lat > -45 && lng > 110 && lng < 155) {
    if (lng >= 140) return "Australia (east)";
    return "Australia";
  }
  return "Australia";
}

export function mapAdlPlaceToAccessPlace(
  place: MapableAdlCompactPlace,
): DemoAccessPlace {
  const profile = profileForLayer(place.layer);
  const facts = [place.fact];
  if (place.desc) facts.push(place.desc.slice(0, 160));

  return {
    id: place.id,
    slug: place.slug,
    name: place.name,
    category: place.category,
    suburb: suburbFromCoords(place.lat, place.lng),
    state: "AU",
    latitude: place.lat,
    longitude: place.lng,
    accessScore: place.layer.toLowerCase() === "stairs" ? 20 : 50,
    tier: "Unverified",
    confidence: "low",
    lastChecked: "imported",
    source: "partner",
    topAccessFacts: facts,
    keyBarrier: place.layer.toLowerCase() === "stairs" ? "Stairs reported at this location" : null,
    isDemo: false,
    profile,
    measurements: [],
    sensoryNotes: [],
    domains: [
      {
        name: "Source",
        summary: `${MAPABLE_ADL_SOURCE_LABEL}. Layer: ${place.layer || "unknown"}.`,
        status: "known",
      },
      {
        name: "Online information",
        summary: `Imported from ${MAPABLE_MY_MAPS_KML_URL.includes("mid=") ? "MapAble Google My Maps KML" : "MapAble KML"}.`,
        status: "known",
      },
    ],
  };
}

export async function loadMapableAdlDataset(): Promise<MapableAdlDataset | null> {
  if (cachedDataset !== undefined) return cachedDataset;

  try {
    const full = path.join(process.cwd(), MAPABLE_ADL_DATASET_PUBLIC_PATH);
    const raw = await readFile(full, "utf8");
    const parsed = JSON.parse(raw) as MapableAdlDataset;
    if (!parsed?.places || !Array.isArray(parsed.places)) {
      cachedDataset = null;
      return null;
    }
    cachedDataset = parsed;
    return parsed;
  } catch {
    cachedDataset = null;
    return null;
  }
}

export async function loadMapableAdlAccessPlaces(): Promise<DemoAccessPlace[]> {
  if (cachedPlaces !== undefined) return cachedPlaces ?? [];
  const dataset = await loadMapableAdlDataset();
  if (!dataset) {
    cachedPlaces = [];
    return [];
  }
  cachedPlaces = dataset.places.map(mapAdlPlaceToAccessPlace);
  return cachedPlaces;
}

/** Test helper — clear module cache between cases. */
export function resetMapableAdlDatasetCacheForTests() {
  cachedDataset = undefined;
  cachedPlaces = undefined;
}
