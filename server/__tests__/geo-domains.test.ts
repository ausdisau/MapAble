import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// Guarantee every map category always has content to show
//
// Two layers of protection:
//   1. Seed coverage unit test – parses SEED_LAYERS directly and asserts that
//      every canonical domain (accessibility, care, transport, employment) has
//      at least one layer assigned to it.  This fails fast when a future
//      committer adds a layer without appropriate domain tags.
//
//   2. API integration test – stubs geoStorage.getMapLayers and drives the
//      real GET /api/geo/layers?domain=X route to verify the domain filter is
//      wired up correctly.  Confirms a response of ≥1 layer per domain.
// ---------------------------------------------------------------------------

// ── 1. Seed coverage unit test (no DB, no HTTP) ──────────────────────────────

describe("SEED_LAYERS domain coverage", () => {
  // Import the seed module at test time so the check is always in sync with
  // the real seed data, not a copy.
  const CANONICAL_DOMAINS = ["accessibility", "care", "transport", "employment"] as const;

  test("every canonical domain has at least one seed layer", async () => {
    // Access the unexported constant via a dynamic import of the compiled module.
    // We re-export it in a thin wrapper below — but since we can't easily
    // re-export a private const, we instead import the entire module and look
    // for the property, falling back to reading the source file.
    //
    // Pragmatic approach: import the file and use the exported seedGeoData fn
    // only as a type anchor, then read the adjacent array by re-requiring with
    // a tiny shim.  The simplest robust approach is to parse the TypeScript
    // source text for the domains arrays.
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const seedPath = path.resolve(
      import.meta.dirname,
      "..",
      "geo",
      "seed.ts",
    );
    const src = await fs.readFile(seedPath, "utf-8");

    // Extract all domains:[...] arrays from the source.  Each layer spec
    // contains `domains: ["d1", "d2", ...]`.
    const domainsPerLayer: string[][] = [];
    const re = /domains:\s*\[([^\]]*)\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      const entries = m[1]
        .split(",")
        .map((s) => s.replace(/["'\s]/g, ""))
        .filter(Boolean);
      if (entries.length > 0) domainsPerLayer.push(entries);
    }

    assert.ok(
      domainsPerLayer.length > 0,
      "Could not find any domains[] arrays in seed.ts – has the file structure changed?",
    );

    for (const domain of CANONICAL_DOMAINS) {
      const covered = domainsPerLayer.some((d) => d.includes(domain));
      assert.ok(
        covered,
        `Domain "${domain}" has no seed layer – at least one SEED_LAYERS entry must list "${domain}" in its domains array.`,
      );
    }
  });
});

// ── 2. HTTP integration test (stubbed geoStorage) ────────────────────────────

let server: import("./helpers").TestServer;
let geoStorage: typeof import("../storage/geo").geoStorage;
let storage: typeof import("../storage").storage;
let sessionCookie: string;

// Minimal participant user for auth mock.
const testUser = {
  id: "user-geo-test-1",
  username: "geodomaintest",
  password: "plain-pw",
  role: "participant",
  fullName: "Geo Tester",
  email: "geo@example.com",
} as any;

before(async () => {
  const helpers = await import("./helpers");
  ({ geoStorage } = await import("../storage/geo"));
  ({ storage } = await import("../storage"));
  server = await helpers.startTestServer();

  // Obtain a real session cookie by driving /api/auth/login with a mocked
  // getUserByUsername so no real DB hit is needed.
  const original = storage.getUserByUsername.bind(storage);
  (storage as any).getUserByUsername = async () => testUser;
  const loginRes = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: testUser.username, password: testUser.password }),
  });
  (storage as any).getUserByUsername = original;
  const cookie = loginRes.headers.get("set-cookie");
  if (!cookie) throw new Error("Login failed during test setup");
  sessionCookie = cookie.split(";")[0];
});

after(async () => {
  await server?.close();
});

async function req(
  path: string,
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${server.baseUrl}${path}`, {
    headers: { cookie: sessionCookie },
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  return { status: res.status, json };
}

/** Build a minimal MapLayer-shaped object for a given domain. */
function fakeLayer(domain: string, idx: number) {
  return {
    id: `layer-${domain}-${idx}`,
    slug: `test-${domain}-${idx}`,
    name: `Test ${domain} layer ${idx}`,
    description: "",
    domains: [domain],
    visibility: "public",
    icon: "Circle",
    color: "#000000",
    attribution: "test",
    sourceUrl: null,
    geometryType: "Point",
    defaultVisible: true,
    ordering: idx * 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;
}

const CANONICAL_DOMAINS = ["accessibility", "care", "transport", "employment"] as const;

// Build a pool of fake layers: one per canonical domain plus a couple that
// span multiple domains (mirrors the real seed).
const ALL_FAKE_LAYERS = [
  // Multi-domain layers (like dpos, ndap, mapable in the real seed)
  { ...fakeLayer("accessibility", 0), id: "multi-1", slug: "multi-1", domains: ["accessibility", "care", "employment"] },
  { ...fakeLayer("accessibility", 1), id: "multi-2", slug: "multi-2", domains: ["accessibility", "care", "transport"] },
  // Domain-specific layers
  fakeLayer("transport", 3),
  fakeLayer("employment", 4),
];

describe("GET /api/geo/layers?domain=X domain filter", () => {
  for (const domain of CANONICAL_DOMAINS) {
    test(`returns ≥1 layer for domain "${domain}"`, async (t) => {
      // Stub getMapLayers to apply the same domain filter the real storage would:
      // return layers whose domains[] includes the requested domain.
      t.mock.method(geoStorage, "getMapLayers", async (filters?: { domain?: string; visibilities?: string[] }) => {
        let result = ALL_FAKE_LAYERS;
        if (filters?.domain) {
          result = result.filter((l: any) => (l.domains as string[]).includes(filters.domain!));
        }
        // visibilities: all test layers are "public", always included.
        return result;
      });

      const { status, json } = await req(`/api/geo/layers?domain=${domain}`);

      assert.equal(status, 200, `Expected 200 for domain "${domain}", got ${status}: ${JSON.stringify(json)}`);
      assert.ok(Array.isArray(json), `Response body should be an array, got: ${JSON.stringify(json)}`);
      assert.ok(
        json.length >= 1,
        `Domain "${domain}" returned 0 layers – every canonical domain must have at least one layer.`,
      );

      // Every returned layer should actually include the requested domain.
      for (const layer of json) {
        assert.ok(
          Array.isArray(layer.domains) && layer.domains.includes(domain),
          `Layer "${layer.slug}" was returned for domain "${domain}" but its domains[] is ${JSON.stringify(layer.domains)}`,
        );
      }
    });
  }

  test("no domain filter returns all layers", async (t) => {
    t.mock.method(geoStorage, "getMapLayers", async () => ALL_FAKE_LAYERS);

    const { status, json } = await req("/api/geo/layers");
    assert.equal(status, 200);
    assert.ok(Array.isArray(json));
    assert.equal(json.length, ALL_FAKE_LAYERS.length);
  });

  test("unknown domain returns empty array (not an error)", async (t) => {
    t.mock.method(geoStorage, "getMapLayers", async () => []);

    const { status, json } = await req("/api/geo/layers?domain=nonexistent");
    assert.equal(status, 200);
    assert.ok(Array.isArray(json));
    assert.equal(json.length, 0);
  });
});
