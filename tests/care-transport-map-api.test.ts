import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/optional-session", () => ({
  getOptionalApiUser: vi.fn(),
}));

vi.mock("@/lib/transport/care-map/map-payload", () => ({
  buildCareTransportMapPayload: vi.fn(),
}));

vi.mock("@/lib/config/care-transport-map", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/config/care-transport-map")
  >("@/lib/config/care-transport-map");
  return {
    ...actual,
    isCareTransportMapEnabled: vi.fn(),
    isAddInfrastructureEnabled: vi.fn(),
  };
});

vi.mock("@/lib/config/search-interpreter", () => ({
  isSearchInterpreterConfigured: vi.fn(() => false),
}));

vi.mock("@/lib/map/nominatim-server", () => ({
  forwardGeocodeAustralia: vi.fn(),
}));

import { GET as getMap } from "@/app/api/care-transport/map/route";
import { POST as postDraft } from "@/app/api/infrastructure/draft/route";
import { getOptionalApiUser } from "@/lib/api/optional-session";
import { buildCareTransportMapPayload } from "@/lib/transport/care-map/map-payload";
import {
  isAddInfrastructureEnabled,
  isCareTransportMapEnabled,
} from "@/lib/config/care-transport-map";
import { forwardGeocodeAustralia } from "@/lib/map/nominatim-server";

describe("GET /api/care-transport/map", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when flag is off", async () => {
    vi.mocked(isCareTransportMapEnabled).mockReturnValue(false);
    const res = await getMap(new Request("http://localhost/api/care-transport/map"));
    expect(res.status).toBe(404);
  });

  it("returns discovery layers for guests without trips", async () => {
    vi.mocked(isCareTransportMapEnabled).mockReturnValue(true);
    vi.mocked(getOptionalApiUser).mockResolvedValue(null);
    vi.mocked(buildCareTransportMapPayload).mockResolvedValue({
      careProviders: { type: "FeatureCollection", features: [] },
      infrastructure: { type: "FeatureCollection", features: [] },
      trips: null,
      meta: {
        careProviderCount: 0,
        infrastructureCount: 0,
        tripPointCount: 0,
        tripsIncluded: false,
        pinLimit: 500,
        honesty: "pilot",
      },
    });

    const res = await getMap(
      new Request(
        "http://localhost/api/care-transport/map?includeTrips=true&layers=careProviders,infrastructure",
      ),
    );
    expect(res.status).toBe(200);
    expect(buildCareTransportMapPayload).toHaveBeenCalledWith(
      expect.objectContaining({
        includeTrips: false,
        participantUserId: null,
      }),
    );
  });

  it("includes trips when signed in and requested", async () => {
    vi.mocked(isCareTransportMapEnabled).mockReturnValue(true);
    vi.mocked(getOptionalApiUser).mockResolvedValue({
      id: "user-1",
    } as Awaited<ReturnType<typeof getOptionalApiUser>>);
    vi.mocked(buildCareTransportMapPayload).mockResolvedValue({
      careProviders: { type: "FeatureCollection", features: [] },
      infrastructure: { type: "FeatureCollection", features: [] },
      trips: { type: "FeatureCollection", features: [] },
      meta: {
        careProviderCount: 0,
        infrastructureCount: 0,
        tripPointCount: 0,
        tripsIncluded: true,
        pinLimit: 500,
        honesty: "pilot",
      },
    });

    const res = await getMap(
      new Request(
        "http://localhost/api/care-transport/map?includeTrips=true&layers=trips",
      ),
    );
    expect(res.status).toBe(200);
    expect(buildCareTransportMapPayload).toHaveBeenCalledWith(
      expect.objectContaining({
        includeTrips: true,
        participantUserId: "user-1",
      }),
    );
  });
});

describe("POST /api/infrastructure/draft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when flag is off", async () => {
    vi.mocked(isAddInfrastructureEnabled).mockReturnValue(false);
    const res = await postDraft(
      new Request("http://localhost/api/infrastructure/draft", {
        method: "POST",
        body: JSON.stringify({ description: "Care support hub in Sydney NSW" }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns heuristic draft and optional geocode", async () => {
    vi.mocked(isAddInfrastructureEnabled).mockReturnValue(true);
    vi.mocked(forwardGeocodeAustralia).mockResolvedValue({
      lat: -33.8688,
      lng: 151.2093,
    });

    const res = await postDraft(
      new Request("http://localhost/api/infrastructure/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "Care support hub in Sydney NSW near Central",
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.draft.category).toBe("care_support_hub");
    expect(body.draft.latitude).toBe(-33.8688);
    expect(body.meta.engine).toBe("heuristic");
    expect(body.meta.geocoded).toBe(true);
  });
});
