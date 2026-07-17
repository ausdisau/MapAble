import { describe, expect, it } from "vitest";

import {
  isOpenSearchConfigured,
  openSearchConfig,
} from "@/lib/config/opensearch";
import {
  isNominatimGeocodingConfigured,
  isOpenStreetMapConfigured,
} from "@/lib/config/openstreetmap";
import { isIntegrationEnvEnabled } from "@/lib/integrations/integration-feature-policy";
import {
  getIntegrationAdapter,
  listRegisteredIntegrationKeys,
} from "@/lib/integrations/integration-registry";
import { SERVICE_CATEGORY_SEARCH_FIELDS } from "@/lib/search/service-category-index";

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

describe("OpenStreetMap config", () => {
  it("is enabled by default", () => {
    const orig = process.env.OPENSTREETMAP_ENABLED;
    delete process.env.OPENSTREETMAP_ENABLED;
    try {
      expect(isOpenStreetMapConfigured()).toBe(true);
    } finally {
      restoreEnv("OPENSTREETMAP_ENABLED", orig);
    }
  });

  it("requires MAP_GEOCODING_NOMINATIM_ENABLED for Nominatim", () => {
    const origEnabled = process.env.OPENSTREETMAP_ENABLED;
    const origNominatim = process.env.MAP_GEOCODING_NOMINATIM_ENABLED;

    process.env.OPENSTREETMAP_ENABLED = "true";
    process.env.MAP_GEOCODING_NOMINATIM_ENABLED = "false";
    expect(isNominatimGeocodingConfigured()).toBe(false);

    process.env.MAP_GEOCODING_NOMINATIM_ENABLED = "true";
    expect(isNominatimGeocodingConfigured()).toBe(true);

    restoreEnv("OPENSTREETMAP_ENABLED", origEnabled);
    restoreEnv("MAP_GEOCODING_NOMINATIM_ENABLED", origNominatim);
  });
});

describe("OpenSearch config", () => {
  it("requires explicit enable and credentials", () => {
    const origEnabled = process.env.OPENSEARCH_ENABLED;
    const origUrl = process.env.OPENSEARCH_URL;
    const origUser = process.env.OPENSEARCH_USERNAME;
    const origPass = process.env.OPENSEARCH_PASSWORD;

    delete process.env.OPENSEARCH_ENABLED;
    expect(isOpenSearchConfigured()).toBe(false);

    process.env.OPENSEARCH_ENABLED = "true";
    process.env.OPENSEARCH_URL = "https://search.example.com";
    process.env.OPENSEARCH_USERNAME = "admin";
    process.env.OPENSEARCH_PASSWORD = "secret";
    expect(isOpenSearchConfigured()).toBe(true);

    restoreEnv("OPENSEARCH_ENABLED", origEnabled);
    restoreEnv("OPENSEARCH_URL", origUrl);
    restoreEnv("OPENSEARCH_USERNAME", origUser);
    restoreEnv("OPENSEARCH_PASSWORD", origPass);
  });

  it("exposes default index and alias names", () => {
    expect(openSearchConfig.serviceCategoryIndex).toBe(
      "mapable_service_categories_v1",
    );
    expect(openSearchConfig.serviceCategoryAlias).toBe(
      "mapable_service_categories_current",
    );
  });
});

describe("OSM / OpenSearch integration registry", () => {
  it("registers openstreetmap and opensearch adapters", () => {
    const keys = listRegisteredIntegrationKeys();
    expect(keys).toContain("openstreetmap");
    expect(keys).toContain("opensearch");
    expect(getIntegrationAdapter("openstreetmap").type).toBe("maps");
    expect(getIntegrationAdapter("opensearch").type).toBe("search");
  });

  it("maps env flags for integration policy", () => {
    const origOsm = process.env.OPENSTREETMAP_ENABLED;
    const origOs = process.env.OPENSEARCH_ENABLED;

    process.env.OPENSTREETMAP_ENABLED = "false";
    expect(isIntegrationEnvEnabled("openstreetmap")).toBe(false);

    process.env.OPENSEARCH_ENABLED = "true";
    expect(isIntegrationEnvEnabled("opensearch")).toBe(true);

    restoreEnv("OPENSTREETMAP_ENABLED", origOsm);
    restoreEnv("OPENSEARCH_ENABLED", origOs);
  });
});

describe("service category index", () => {
  it("defines search field boosts for multi_match", () => {
    expect(SERVICE_CATEGORY_SEARCH_FIELDS).toEqual([
      "name^3",
      "keywords^2",
      "slug",
    ]);
  });
});
