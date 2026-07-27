import { promises as fs } from "fs";
import path from "path";
import { geoStorage } from "../storage/geo";
import { parseGeoFile, type ParsedFeature } from "./import";
import type { InsertMapFeature, InsertMapLayer } from "@shared/schema";

const ASSETS_DIR = path.resolve(import.meta.dirname, "..", "..", "attached_assets");

interface SeedLayerSpec {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  domains: string[];
  geometryType: InsertMapLayer["geometryType"];
  attribution: string;
  sourceUrl?: string;
  file?: string; // KML filename in attached_assets
  defaultVisible?: boolean;
  ordering?: number;
}

const SEED_LAYERS: SeedLayerSpec[] = [
  {
    slug: "dpos", name: "Disabled Persons Organisations", icon: "Users", color: "#1B6EB5",
    description: "Disabled Persons Organisations (DPOs) representing people with disability.",
    domains: ["accessibility", "care", "employment"],
    geometryType: "Point", attribution: "MapAble curated directory", defaultVisible: true, ordering: 10,
  },
  {
    slug: "ndap", name: "NDAP-funded Organisations", icon: "HandHelping", color: "#2EAA6E",
    description: "National Disability Advocacy Program (NDAP) funded advocacy providers.",
    domains: ["accessibility", "care", "employment"],
    geometryType: "Point", attribution: "DSS National Disability Advocacy Program", defaultVisible: true, ordering: 20,
  },
  {
    slug: "mapable", name: "MapAble Accessible Locations", icon: "Accessibility", color: "#E6A817",
    description: "Wheelchair-accessible locations from the MapAble community map.",
    domains: ["accessibility", "care", "transport"],
    geometryType: "Point", attribution: "MapAble community (Google My Maps)",
    sourceUrl: "https://www.google.com/maps/d/kml?forcekml=1&mid=1sx0iyF2RqJKO8maeZ_Sn_EvWVyybcrOI",
    file: "MapAble_1776754220378.kml", defaultVisible: false, ordering: 30,
  },
  {
    slug: "mobility-parking", name: "Mobility Parking", icon: "ParkingCircle", color: "#1B6EB5",
    description: "Accessible parking bays with dimensions, angle and audit date.",
    domains: ["accessibility", "transport"],
    geometryType: "Point", attribution: "City of Sydney open data",
    file: "Mobility_parking_1776754220378.kml", defaultVisible: false, ordering: 40,
  },
  {
    slug: "stairs", name: "Stairs", icon: "Footprints", color: "#E6A817",
    description: "Stairs with step count, handrails, TGSI and contrast strip info.",
    domains: ["accessibility", "transport"],
    geometryType: "Point", attribution: "City of Sydney open data",
    file: "Stairs_1776754220378.kml", defaultVisible: false, ordering: 50,
  },
  {
    slug: "lifts", name: "Lifts & Escalators", icon: "MoveVertical", color: "#2EAA6E",
    description: "Lifts and escalators with door width and continuous-path information.",
    domains: ["accessibility", "transport"],
    geometryType: "Point", attribution: "City of Sydney open data",
    file: "Lifts_1776754220378.kml", defaultVisible: false, ordering: 60,
  },
  {
    slug: "playgrounds", name: "All-abilities Playgrounds", icon: "ToyBrick", color: "#E6A817",
    description: "All-abilities playgrounds with equipment, facilities and contact details.",
    domains: ["accessibility", "care"],
    geometryType: "Point", attribution: "Queensland Government disability services",
    file: "all-abilities-playgrounds_1776754220378.kml", defaultVisible: false, ordering: 70,
  },
  {
    slug: "navability-routes", name: "Navability Routes", icon: "Route", color: "#1B6EB5",
    description: "Accessible walking routes colour-coded by effort.",
    domains: ["accessibility", "transport"],
    geometryType: "LineString", attribution: "Navability accessible routes",
    file: "Navability_routes_1776754220378.kml", defaultVisible: false, ordering: 80,
  },
];

// Curated seed data for DPOs and NDAP providers (peak national bodies + key state offices).
const DPO_SEED = [
  { name: "People with Disability Australia (PWDA)", lng: 151.2007, lat: -33.8915, attrs: { type: "National DPO", suburb: "Sydney", state: "NSW", phone: "1800 422 015", website: "https://pwd.org.au" } },
  { name: "Australian Federation of Disability Organisations (AFDO)", lng: 144.9926, lat: -37.8226, attrs: { type: "National DPO peak", suburb: "Melbourne", state: "VIC", website: "https://www.afdo.org.au" } },
  { name: "First Peoples Disability Network (FPDN)", lng: 151.0470, lat: -33.8148, attrs: { type: "National First Nations DPO", suburb: "Sydney", state: "NSW", website: "https://fpdn.org.au" } },
  { name: "Inclusion Australia", lng: 144.9631, lat: -37.8136, attrs: { type: "National DPO (intellectual disability)", suburb: "Melbourne", state: "VIC", website: "https://www.inclusionaustralia.org.au" } },
  { name: "Women With Disabilities Australia (WWDA)", lng: 147.3257, lat: -42.8806, attrs: { type: "National DPO", suburb: "Hobart", state: "TAS", website: "https://wwda.org.au" } },
  { name: "Physical Disability Australia (PDA)", lng: 153.0260, lat: -27.4705, attrs: { type: "National DPO", suburb: "Brisbane", state: "QLD", website: "https://pda.org.au" } },
];

const NDAP_SEED = [
  { name: "Disability Advocacy NSW", lng: 151.7789, lat: -32.9283, attrs: { program: "NDAP", suburb: "Newcastle", state: "NSW", phone: "1300 365 085" } },
  { name: "Villamanta Disability Rights Legal Service", lng: 144.3598, lat: -38.1499, attrs: { program: "NDAP", suburb: "Geelong", state: "VIC" } },
  { name: "Queensland Advocacy for Inclusion", lng: 153.0260, lat: -27.4698, attrs: { program: "NDAP", suburb: "Brisbane", state: "QLD" } },
  { name: "Disability Advocacy & Complaints Service of SA", lng: 138.6007, lat: -34.9285, attrs: { program: "NDAP", suburb: "Adelaide", state: "SA" } },
  { name: "Advocacy WA", lng: 115.8605, lat: -31.9523, attrs: { program: "NDAP", suburb: "Perth", state: "WA" } },
  { name: "Advocacy Tasmania", lng: 147.3257, lat: -42.8821, attrs: { program: "NDAP", suburb: "Hobart", state: "TAS" } },
];

function effortColor(effort?: string): string | undefined {
  if (!effort) return undefined;
  const e = effort.toLowerCase();
  if (e.includes("easy")) return "#2EAA6E";
  if (e.includes("moderate")) return "#E6A817";
  if (e.includes("hard") || e.includes("difficult")) return "#D64545";
  return undefined;
}

export async function seedGeoData(): Promise<{ seeded: boolean; layers: number; features: number }> {
  const existing = await geoStorage.getMapLayers();
  if (existing.length > 0) {
    return { seeded: false, layers: existing.length, features: 0 };
  }

  let totalFeatures = 0;
  let layerCount = 0;

  for (const spec of SEED_LAYERS) {
    const layer = await geoStorage.createMapLayer({
      slug: spec.slug,
      name: spec.name,
      description: spec.description,
      domains: spec.domains,
      visibility: "public",
      icon: spec.icon,
      color: spec.color,
      attribution: spec.attribution,
      sourceUrl: spec.sourceUrl,
      geometryType: spec.geometryType,
      defaultVisible: spec.defaultVisible ?? false,
      ordering: spec.ordering ?? 100,
    } as InsertMapLayer);
    layerCount++;

    let parsed: ParsedFeature[] = [];

    if (spec.slug === "dpos") {
      parsed = DPO_SEED.map((d) => ({
        name: d.name, geometry: { type: "Point", coordinates: [d.lng, d.lat] }, attributes: d.attrs,
      }));
    } else if (spec.slug === "ndap") {
      parsed = NDAP_SEED.map((d) => ({
        name: d.name, geometry: { type: "Point", coordinates: [d.lng, d.lat] }, attributes: d.attrs,
      }));
    } else if (spec.file) {
      const filePath = path.join(ASSETS_DIR, spec.file);
      try {
        const content = await fs.readFile(filePath, "utf-8");
        parsed = await parseGeoFile(content, { resolveNetworkLinks: true });
      } catch (err) {
        console.warn(`[geo seed] Could not read/parse ${spec.file}:`, (err as Error).message);
        parsed = [];
      }
    }

    if (parsed.length > 0) {
      const rows: InsertMapFeature[] = parsed.map((f) => ({
        layerId: layer.id,
        name: f.name,
        description: f.description,
        geometry: f.geometry,
        attributes: {
          ...f.attributes,
          ...(spec.slug === "navability-routes" && f.attributes?.Effort
            ? { _color: effortColor(String(f.attributes.Effort)) }
            : {}),
        },
        source: spec.attribution,
        externalId: f.externalId,
      }));
      const inserted = await geoStorage.bulkCreateMapFeatures(rows);
      totalFeatures += inserted;
      console.log(`[geo seed] ${spec.slug}: ${inserted} features`);
    } else {
      console.log(`[geo seed] ${spec.slug}: 0 features`);
    }
  }

  // Seed a couple of default categories
  const cats = [
    { slug: "wheelchair-parking", name: "Wheelchair-accessible parking", icon: "ParkingCircle", color: "#1B6EB5" },
    { slug: "all-abilities-playground", name: "All-abilities playground", icon: "ToyBrick", color: "#E6A817" },
    { slug: "advocacy", name: "Advocacy & support", icon: "HandHelping", color: "#2EAA6E" },
  ];
  for (const c of cats) {
    try { await geoStorage.createMapCategory(c); } catch { /* ignore dup */ }
  }

  return { seeded: true, layers: layerCount, features: totalFeatures };
}
