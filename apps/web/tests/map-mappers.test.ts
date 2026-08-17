import { describe, expect, it } from "vitest";

import type { Provider } from "@/app/provider-finder/providers";
import type { NdisProviderSearchRow } from "@/lib/ingestion/ndis-providers-search";
import {
  accessPlaceToMapPointEntity,
  ndisRowHasCoordinates,
  ndisRowToMapPointEntity,
  ndisRowToProvider,
  providerToMapPointEntity,
} from "@/lib/map/mappers";

describe("ndis provider mapper", () => {
  const baseRow: NdisProviderSearchRow = {
    source_id: "ndis-1",
    provider_name: "Acme Supports",
    suburb: "Parramatta",
    state: "NSW",
    postcode: "2150",
    latitude: -33.815,
    longitude: 151.0,
    phone: null,
    email: null,
    website: null,
    services: ["Therapeutic Supports"],
    registration_groups: ["0115"],
    updated_at: new Date(),
  };

  it("detects coordinates", () => {
    expect(ndisRowHasCoordinates(baseRow)).toBe(true);
    expect(
      ndisRowHasCoordinates({ ...baseRow, latitude: null, longitude: null }),
    ).toBe(false);
  });

  it("maps to map entity when coords present", () => {
    const entity = ndisRowToMapPointEntity(baseRow);
    expect(entity?.kind).toBe("provider");
    expect(entity?.lat).toBe(-33.815);
  });

  it("maps to Provider DTO", () => {
    const p = ndisRowToProvider(baseRow);
    expect(p.id).toBe("ndis-1");
    expect(p.latitude).toBe(-33.815);
  });
});

describe("provider outlet map entity", () => {
  it("returns null without coords", () => {
    const p: Provider = {
      id: "x",
      slug: "x",
      name: "X",
      suburb: "A",
      state: "NSW",
      postcode: "2000",
      distanceKm: 0,
      rating: 0,
      reviewCount: 0,
      registered: true,
      categories: [],
      supports: ["In-person"],
    };
    expect(providerToMapPointEntity(p)).toBeNull();
  });
});

describe("access place mapper", () => {
  it("maps access place to entity", () => {
    const e = accessPlaceToMapPointEntity({
      id: "ap1",
      name: "Cafe",
      latitude: -33.87,
      longitude: 151.2,
    });
    expect(e.kind).toBe("access_place");
    expect(e.layerId).toBe("access-places-layer");
  });
});
