import { test, before, after, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// Map-layer domain validation tests
//
// Locks in the enforcement added for layer domains: layers may only be saved
// with valid domain values (accessibility/care/transport/employment) and must
// have at least one domain. Verifies HTTP 400 rejections and 2xx acceptance
// on the three admin write paths:
//   - POST  /api/geo/layers
//   - PATCH /api/geo/layers/:id
//   - POST  /api/geo/import (newLayer.domains)
//
// All geoStorage methods are mocked so no database is touched; the tests
// exercise the real route handlers + insertMapLayerSchema validation.
// ---------------------------------------------------------------------------

let server: import("./helpers").TestServer;
let geoStorage: typeof import("../storage/geo").geoStorage;
let storage: typeof import("../storage").storage;
let sessionCookie: string;

const adminUser = {
  id: "user-geo-admin-1",
  username: "geoadmintest",
  password: "plain-pw",
  role: "admin",
  fullName: "Geo Admin",
  email: "geoadmin@example.com",
} as any;

let originalGetUser: any;

before(async () => {
  const helpers = await import("./helpers");
  ({ geoStorage } = await import("../storage/geo"));
  ({ storage } = await import("../storage"));
  server = await helpers.startTestServer();

  // Log in as an admin with mocked user lookup (no DB).
  const originalByUsername = storage.getUserByUsername.bind(storage);
  (storage as any).getUserByUsername = async () => adminUser;
  const loginRes = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: adminUser.username, password: adminUser.password }),
  });
  (storage as any).getUserByUsername = originalByUsername;
  const cookie = loginRes.headers.get("set-cookie");
  if (!cookie) throw new Error("Login failed during test setup");
  sessionCookie = cookie.split(";")[0];

  // requireRole("admin") looks the user up on every request.
  originalGetUser = storage.getUser.bind(storage);
  (storage as any).getUser = async (id: string) =>
    id === adminUser.id ? adminUser : undefined;
});

after(async () => {
  if (originalGetUser) (storage as any).getUser = originalGetUser;
  await server?.close();
});

async function req(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${server.baseUrl}${path}`, {
    method,
    headers: { cookie: sessionCookie, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  return { status: res.status, json };
}

/** Stub every geoStorage write the routes touch so nothing hits the DB. */
function stubGeoWrites(t: any) {
  t.mock.method(geoStorage, "createMapLayer", async (data: any) => ({
    id: "layer-created-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  }));
  t.mock.method(geoStorage, "updateMapLayer", async (id: string, data: any) => ({
    id,
    slug: "existing-layer",
    name: "Existing Layer",
    domains: ["accessibility"],
    visibility: "public",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  }));
  t.mock.method(geoStorage, "deleteFeaturesByLayer", async () => {});
  t.mock.method(geoStorage, "bulkCreateMapFeatures", async (rows: any[]) => rows.length);
  t.mock.method(geoStorage, "logGeoAudit", async () => {});
}

const validLayerBody = {
  slug: "test-domain-layer",
  name: "Test Domain Layer",
  domains: ["accessibility", "transport"],
};

const MINIMAL_GEOJSON = JSON.stringify({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Test point" },
      geometry: { type: "Point", coordinates: [151.2, -33.9] },
    },
  ],
});

describe("POST /api/geo/layers domain validation", () => {
  test("rejects an unknown domain with 400", async (t) => {
    stubGeoWrites(t);
    const { status } = await req("POST", "/api/geo/layers", {
      ...validLayerBody,
      domains: ["accessibility", "bogus-domain"],
    });
    assert.equal(status, 400);
    assert.equal((geoStorage.createMapLayer as any).mock.callCount(), 0);
  });

  test("rejects an empty domains array with 400", async (t) => {
    stubGeoWrites(t);
    const { status } = await req("POST", "/api/geo/layers", {
      ...validLayerBody,
      domains: [],
    });
    assert.equal(status, 400);
    assert.equal((geoStorage.createMapLayer as any).mock.callCount(), 0);
  });

  test("rejects a non-array domains value with 400", async (t) => {
    stubGeoWrites(t);
    const { status } = await req("POST", "/api/geo/layers", {
      ...validLayerBody,
      domains: "accessibility",
    });
    assert.equal(status, 400);
    assert.equal((geoStorage.createMapLayer as any).mock.callCount(), 0);
  });

  test("accepts valid domains with 201", async (t) => {
    stubGeoWrites(t);
    const { status, json } = await req("POST", "/api/geo/layers", validLayerBody);
    assert.equal(status, 201, JSON.stringify(json));
    assert.deepEqual(json.domains, ["accessibility", "transport"]);
    assert.equal((geoStorage.createMapLayer as any).mock.callCount(), 1);
  });
});

describe("PATCH /api/geo/layers/:id domain validation", () => {
  test("rejects an unknown domain with 400", async (t) => {
    stubGeoWrites(t);
    const { status } = await req("PATCH", "/api/geo/layers/layer-1", {
      domains: ["nonsense"],
    });
    assert.equal(status, 400);
    assert.equal((geoStorage.updateMapLayer as any).mock.callCount(), 0);
  });

  test("rejects an empty domains array with 400", async (t) => {
    stubGeoWrites(t);
    const { status } = await req("PATCH", "/api/geo/layers/layer-1", {
      domains: [],
    });
    assert.equal(status, 400);
    assert.equal((geoStorage.updateMapLayer as any).mock.callCount(), 0);
  });

  test("accepts a valid domains update with 200", async (t) => {
    stubGeoWrites(t);
    const { status, json } = await req("PATCH", "/api/geo/layers/layer-1", {
      domains: ["care", "employment"],
    });
    assert.equal(status, 200, JSON.stringify(json));
    assert.deepEqual(json.domains, ["care", "employment"]);
    assert.equal((geoStorage.updateMapLayer as any).mock.callCount(), 1);
  });

  test("accepts an update that omits domains entirely", async (t) => {
    stubGeoWrites(t);
    const { status } = await req("PATCH", "/api/geo/layers/layer-1", {
      name: "Renamed Layer",
    });
    assert.equal(status, 200);
    assert.equal((geoStorage.updateMapLayer as any).mock.callCount(), 1);
  });
});

describe("POST /api/geo/import newLayer.domains validation", () => {
  test("rejects an unknown domain in newLayer.domains with 400", async (t) => {
    stubGeoWrites(t);
    const { status } = await req("POST", "/api/geo/import", {
      newLayer: { slug: "imported-layer", name: "Imported", domains: ["invalid-domain"] },
      content: MINIMAL_GEOJSON,
    });
    assert.equal(status, 400);
    assert.equal((geoStorage.createMapLayer as any).mock.callCount(), 0);
  });

  test("rejects an empty newLayer.domains array with 400", async (t) => {
    stubGeoWrites(t);
    const { status } = await req("POST", "/api/geo/import", {
      newLayer: { slug: "imported-layer", name: "Imported", domains: [] },
      content: MINIMAL_GEOJSON,
    });
    assert.equal(status, 400);
    assert.equal((geoStorage.createMapLayer as any).mock.callCount(), 0);
  });

  test("accepts valid newLayer.domains and imports with 201", async (t) => {
    stubGeoWrites(t);
    const { status, json } = await req("POST", "/api/geo/import", {
      newLayer: { slug: "imported-layer", name: "Imported", domains: ["transport"] },
      content: MINIMAL_GEOJSON,
    });
    assert.equal(status, 201, JSON.stringify(json));
    assert.equal(json.imported, 1);
    const createCalls = (geoStorage.createMapLayer as any).mock.calls;
    assert.equal(createCalls.length, 1);
    assert.deepEqual(createCalls[0].arguments[0].domains, ["transport"]);
  });

  test("omitted newLayer.domains falls back to a valid default", async (t) => {
    stubGeoWrites(t);
    const { status } = await req("POST", "/api/geo/import", {
      newLayer: { slug: "imported-layer-2", name: "Imported 2" },
      content: MINIMAL_GEOJSON,
    });
    assert.equal(status, 201);
    const createCalls = (geoStorage.createMapLayer as any).mock.calls;
    assert.deepEqual(createCalls[0].arguments[0].domains, ["accessibility"]);
  });
});
