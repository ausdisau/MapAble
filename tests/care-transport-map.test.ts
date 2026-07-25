import { afterEach, describe, expect, it, vi } from "vitest";

import {
  draftInfrastructureFromDescription,
} from "@/lib/care-transport-map/infrastructure-draft";
import { planCareTransportMapActions } from "@/lib/care-transport-map/map-actions";
import {
  isAddInfrastructureEnabled,
  isCareTransportMapEnabled,
} from "@/lib/config/care-transport-map";

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

describe("care-transport-map config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults map and add-infrastructure flags to false", () => {
    const mapOrig = process.env.CARE_TRANSPORT_MAP_ENABLED;
    const addOrig = process.env.ADD_INFRASTRUCTURE_ENABLED;
    delete process.env.CARE_TRANSPORT_MAP_ENABLED;
    delete process.env.ADD_INFRASTRUCTURE_ENABLED;
    try {
      expect(isCareTransportMapEnabled()).toBe(false);
      expect(isAddInfrastructureEnabled()).toBe(false);
    } finally {
      restoreEnv("CARE_TRANSPORT_MAP_ENABLED", mapOrig);
      restoreEnv("ADD_INFRASTRUCTURE_ENABLED", addOrig);
    }
  });

  it("enables when env is true", () => {
    const mapOrig = process.env.CARE_TRANSPORT_MAP_ENABLED;
    const addOrig = process.env.ADD_INFRASTRUCTURE_ENABLED;
    process.env.CARE_TRANSPORT_MAP_ENABLED = "true";
    process.env.ADD_INFRASTRUCTURE_ENABLED = "true";
    try {
      expect(isCareTransportMapEnabled()).toBe(true);
      expect(isAddInfrastructureEnabled()).toBe(true);
    } finally {
      restoreEnv("CARE_TRANSPORT_MAP_ENABLED", mapOrig);
      restoreEnv("ADD_INFRASTRUCTURE_ENABLED", addOrig);
    }
  });
});

describe("planCareTransportMapActions", () => {
  it("flies to Parramatta and sets care layers", () => {
    const planned = planCareTransportMapActions(
      "Care providers near Parramatta",
    );
    expect(planned.mapActions.some((a) => a.type === "flyTo")).toBe(true);
    const layers = planned.mapActions.find((a) => a.type === "setLayers");
    expect(layers?.type === "setLayers" && layers.layers).toContain(
      "careProviders",
    );
    expect(planned.answer.toLowerCase()).toContain("pilot");
  });

  it("suggests infrastructure when user asks to add a hub", () => {
    const planned = planCareTransportMapActions(
      "Add a care support hub in Newcastle",
    );
    expect(
      planned.mapActions.some((a) => a.type === "suggestInfrastructure"),
    ).toBe(true);
    expect(planned.answer.toLowerCase()).toContain("openstreetmap");
  });
});

describe("draftInfrastructureFromDescription", () => {
  it("infers pickup category and suburb", () => {
    const draft = draftInfrastructureFromDescription(
      'Accessible pickup bay called "Market Street bay" in Parramatta NSW',
    );
    expect(draft.category).toBe("accessible_pickup_point");
    expect(draft.name.toLowerCase()).toContain("market");
    expect(draft.suburb).toBe("Parramatta");
    expect(draft.stateOrRegion).toBe("NSW");
    expect(draft.geocodeQuery).toMatch(/Parramatta/);
  });

  it("infers transport depot", () => {
    const draft = draftInfrastructureFromDescription(
      "Fleet depot for accessible vans in Brisbane QLD",
    );
    expect(draft.category).toBe("transport_depot");
  });
});
