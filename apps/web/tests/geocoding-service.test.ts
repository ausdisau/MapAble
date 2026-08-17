import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst } = vi.hoisted(() => ({
  findFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    searchableLocation: { findFirst },
  },
}));

vi.mock("@/lib/map/nominatim-server", () => ({
  forwardGeocodeAustralia: vi.fn(async () => ({ lat: -33.87, lng: 151.21 })),
}));

import { geocodeSuburbPostcode } from "@/lib/map/geocoding-service";
import { forwardGeocodeAustralia } from "@/lib/map/nominatim-server";

describe("geocodeSuburbPostcode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MAP_GEOCODING_NOMINATIM_ENABLED;
  });

  it("returns null when suburb and postcode missing", async () => {
    expect(await geocodeSuburbPostcode()).toBeNull();
  });

  it("uses Nominatim when enabled and location row exists", async () => {
    process.env.MAP_GEOCODING_NOMINATIM_ENABLED = "true";
    findFirst.mockResolvedValue({
      displayName: "Parramatta NSW 2150",
    });
    const coords = await geocodeSuburbPostcode("Parramatta", "2150", "NSW");
    expect(coords).toEqual({ lat: -33.87, lng: 151.21 });
    expect(forwardGeocodeAustralia).toHaveBeenCalledWith("Parramatta NSW 2150");
  });
});
