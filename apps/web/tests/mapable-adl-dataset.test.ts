import { existsSync, readFileSync } from "fs";
import path from "path";

import { describe, expect, it } from "vitest";

import { isAllowlistedNetworkLinkUrl } from "@/lib/access/import/kml-networklink-service";
import { parseKmlXml } from "@/lib/access/import/kml-parser-service";
import {
  ACCESS_ADL_KML_FILENAME,
  MAPABLE_ADL_DATASET_PUBLIC_PATH,
  MAPABLE_MY_MAPS_KML_URL,
  MAPABLE_MY_MAPS_SHARE_URL,
} from "@/lib/access/map/copy";
import {
  mapAdlPlaceToAccessPlace,
  type MapableAdlCompactPlace,
} from "@/lib/access/map/mapable-adl-dataset";
import { resolveMapableMyMapsKmlUrl } from "@/lib/access/map/mapable-my-maps-url";
import { filterDemoPlaces } from "@/lib/demo/accessibility-places";

describe("MapAble ADL KML integration", () => {
  it("allowlists the MapAble Google My Maps KML and share URLs", () => {
    expect(isAllowlistedNetworkLinkUrl(MAPABLE_MY_MAPS_KML_URL)).toBe(true);
    expect(isAllowlistedNetworkLinkUrl(MAPABLE_MY_MAPS_SHARE_URL)).toBe(true);
    expect(resolveMapableMyMapsKmlUrl(MAPABLE_MY_MAPS_SHARE_URL)).toBe(
      MAPABLE_MY_MAPS_KML_URL
    );
  });

  it("parses NetworkLink stub for operations filename", () => {
    const stubPath = path.join(
      process.cwd(),
      "data/imports",
      ACCESS_ADL_KML_FILENAME
    );
    expect(existsSync(stubPath)).toBe(true);
    const xml = readFileSync(stubPath, "utf8");
    const doc = parseKmlXml(xml);
    expect(doc.networkLinkHref).toBe(MAPABLE_MY_MAPS_KML_URL);
  });

  it("ships compact Access Map dataset with mapped places", () => {
    const datasetPath = path.join(process.cwd(), MAPABLE_ADL_DATASET_PUBLIC_PATH);
    expect(existsSync(datasetPath)).toBe(true);
    const dataset = JSON.parse(readFileSync(datasetPath, "utf8")) as {
      source: string;
      count: number;
      places: MapableAdlCompactPlace[];
    };
    expect(dataset.source).toContain("Australian Disability");
    expect(dataset.count).toBeGreaterThan(1000);
    expect(dataset.places.length).toBe(dataset.count);

    const sample = dataset.places[0];
    const place = mapAdlPlaceToAccessPlace(sample);
    expect(place.isDemo).toBe(false);
    expect(place.source).toBe("partner");
    expect(place.latitude).toBeTypeOf("number");
    expect(place.longitude).toBeTypeOf("number");
    expect(place.slug.length).toBeGreaterThan(0);
  });

  it("maps mobility parking and toilets to access profile hints", () => {
    const toilet = mapAdlPlaceToAccessPlace({
      id: "adl-test-toilet",
      slug: "test-toilet",
      name: "Test Toilet",
      layer: "ToiletmapExport_170601_090005.csv",
      category: "public_toilet",
      lat: -33.8,
      lng: 151.2,
      fact: "Accessible toilet",
    });
    expect(toilet.profile.accessibleToilet).toBe(true);

    const parking = mapAdlPlaceToAccessPlace({
      id: "adl-test-parking",
      slug: "test-parking",
      name: "Mobility parking",
      layer: "Mobility_parking",
      category: "other",
      lat: -33.9,
      lng: 151.1,
      fact: "Mobility parking bay",
    });
    expect(parking.profile.accessibleParking).toBe(true);
  });

  it("filters partner places by query", () => {
    const places = [
      mapAdlPlaceToAccessPlace({
        id: "adl-a",
        slug: "cerebral-palsy",
        name: "Cerebral Palsy Alliance",
        layer: "Services",
        category: "health_service",
        lat: -33.8,
        lng: 151.1,
        fact: "Service",
      }),
      mapAdlPlaceToAccessPlace({
        id: "adl-b",
        slug: "other-place",
        name: "Unrelated Venue",
        layer: "Services",
        category: "health_service",
        lat: -33.7,
        lng: 151.0,
        fact: "Service",
      }),
    ];
    const filtered = filterDemoPlaces(places, { query: "cerebral" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toContain("Cerebral");
  });
});
