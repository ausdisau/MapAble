import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, type TestServer } from "./helpers";

let server: TestServer;

before(async () => {
  server = await startTestServer();
});

after(async () => {
  await server?.close();
});

async function req(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: any; text: string }> {
  const res = await fetch(`${server.baseUrl}${path}`, {
    method,
    headers: body !== undefined ? { "content-type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

// Protected endpoints across each domain. Each must reject unauthenticated
// requests with 401 (requireAuth / requireRole) rather than 404, 5xx, or a 200.
const PROTECTED: Array<[method: string, path: string]> = [
  // payments
  ["POST", "/api/payments/create-intent"],
  ["GET", "/api/payment-methods"],
  ["GET", "/api/payouts/account"],
  ["GET", "/api/ndis/integration-status"],
  ["POST", "/api/billing/setup-orb"],
  ["GET", "/api/billing/usage"],
  // worker
  ["GET", "/api/worker/me"],
  ["GET", "/api/worker/bookings"],
  ["GET", "/api/worker/earnings"],
  ["GET", "/api/worker/dashboard"],
  // grocery
  ["GET", "/api/grocery/supplier/status"],
  ["POST", "/api/grocery/supplier/sync"],
  ["GET", "/api/grocery/orders"],
  // scheduling / ndis
  ["POST", "/api/ndis/sync-plan"],
  ["GET", "/api/ndis/price-guide"],
  ["POST", "/api/ndis/validate-rate"],
  // pricing-billing
  ["PATCH", "/api/invoices/1/status"],
  // geo (requireRole admin)
  ["POST", "/api/geo/categories"],
  ["PATCH", "/api/geo/categories/1"],
  ["DELETE", "/api/geo/categories/1"],
];

// Public config endpoints that are explicitly allowlisted by the global
// `app.use("/api", ...)` auth gate (see server/routes/auth.ts). They must be
// reachable (200 JSON) without authentication and without touching the database.
const PUBLIC_CONFIG: Array<[method: string, path: string]> = [
  ["GET", "/api/stripe/config"],
  ["GET", "/api/auth/auth0/config"],
  ["GET", "/api/quickbooks/config"],
];

// Routes that are NOT in the global auth-gate allowlist must be rejected with
// 401 by that gate even though their handlers carry no per-route requireAuth.
// This guards the allowlist itself against drift.
const GATE_PROTECTED: Array<[method: string, path: string]> = [
  ["GET", "/api/widget-config"],
  ["GET", "/api/jobs"],
  ["GET", "/api/pricing/care"],
  ["GET", "/api/grocery/products"],
];

// Webhook endpoints are public (no requireAuth) but signature/feature gated.
// They must be reachable: never 404 and never the auth 401 of a protected route.
const WEBHOOKS: Array<[method: string, path: string]> = [
  ["POST", "/api/webhooks/stripe"],
  ["POST", "/api/webhooks/orb"],
];

describe("API route smoke tests", () => {
  describe("protected routes reject unauthenticated requests", () => {
    for (const [method, path] of PROTECTED) {
      test(`${method} ${path} -> 401`, async () => {
        const { status, json } = await req(method, path, method === "GET" ? undefined : {});
        assert.equal(
          status,
          401,
          `expected 401 for ${method} ${path}, got ${status} (${JSON.stringify(json)})`,
        );
      });
    }
  });

  describe("global auth gate protects non-allowlisted routes", () => {
    for (const [method, path] of GATE_PROTECTED) {
      test(`${method} ${path} -> 401`, async () => {
        const { status, json } = await req(method, path);
        assert.equal(
          status,
          401,
          `expected gate 401 for ${method} ${path}, got ${status} (${JSON.stringify(json)})`,
        );
      });
    }
  });

  describe("public config routes are reachable", () => {
    for (const [method, path] of PUBLIC_CONFIG) {
      test(`${method} ${path} -> 200 json`, async () => {
        const { status, json } = await req(method, path);
        assert.equal(status, 200, `expected 200 for ${method} ${path}, got ${status}`);
        assert.ok(json && typeof json === "object", `expected JSON object body for ${path}`);
      });
    }
  });

  describe("webhook routes are registered and reachable", () => {
    // Webhooks are public (no requireAuth) but signature/feature gated, so a bad
    // request legitimately yields 503 (feature off) / 400 / 401 (bad signature).
    // The routing smoke check is simply that they are registered (not 404) and
    // do not fall through to the generic "Not authenticated" requireAuth guard.
    for (const [method, path] of WEBHOOKS) {
      test(`${method} ${path} reachable (registered, not requireAuth)`, async () => {
        const { status, json } = await req(method, path, {});
        assert.notEqual(status, 404, `${method} ${path} should be registered (got 404)`);
        const isRequireAuthReject = status === 401 && json?.message === "Not authenticated";
        assert.ok(
          !isRequireAuthReject,
          `${method} ${path} is public; should not hit requireAuth (got 401 Not authenticated)`,
        );
      });
    }
  });

  describe("auth contract", () => {
    test("GET /api/auth/me without session -> 401", async () => {
      const { status } = await req("GET", "/api/auth/me");
      assert.equal(status, 401);
    });

    test("POST /api/auth/login without credentials -> 400", async () => {
      const { status } = await req("POST", "/api/auth/login", {});
      assert.equal(status, 400);
    });

    test("POST /api/auth/logout reachable -> 200", async () => {
      const { status } = await req("POST", "/api/auth/logout", {});
      assert.equal(status, 200);
    });
  });
});
