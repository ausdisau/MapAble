import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, type TestServer } from "./helpers";
import { registry, defaultIntentRouter, chatModules } from "../chat";
import type { ChatContext } from "../chat";
import { handoffModule } from "../chat/modules";
import { toNumericNdisClaim, toNumericNdisClaims, type NdisClaim } from "@shared/schema";

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

// The chat refactor must preserve the exact tool surface the monolithic engine
// exposed. These checks guard against a module silently dropping a tool, the
// registry failing to wire a handler, or the router losing always-on safety
// modules / its fall-back-to-all behaviour.
describe("MapAble Chat module registry + router parity", () => {
  const EXPECTED_TOOLS = [
    "get_user_profile",
    "update_user_profile",
    "search_transport_workers",
    "get_transport_pricing",
    "book_transport",
    "check_barrier_reports",
    "list_my_barrier_reports",
    "submit_barrier_report",
    "update_barrier_report",
    "get_upcoming_shifts",
    "book_shift",
    "get_pending_invoices",
    "get_budget_summary",
    "get_ndis_plan_goals",
    "search_grocery_products",
    "get_grocery_orders",
    "navigate_to_groceries",
    "view_grocery_cart",
    "log_incident_draft",
    "log_complaint_draft",
    "record_consent",
    "flag_safeguarding_concern",
    "escalate_to_human",
  ].sort();

  const ctx = {} as ChatContext;

  test("registry exposes exactly the original tool set", () => {
    const toolNames = registry
      .getAllTools()
      .map((t) => (t.type === "function" ? t.function.name : ""))
      .sort();
    assert.deepEqual(toolNames, EXPECTED_TOOLS);
  });

  test("every registered tool resolves to a handler", () => {
    for (const tool of registry.getAllTools()) {
      if (tool.type !== "function") continue;
      assert.ok(
        typeof registry.getHandler(tool.function.name) === "function",
        `no handler wired for tool ${tool.function.name}`,
      );
    }
  });

  test("router always includes always-on modules (safeguarding/handoff/profile)", () => {
    const selected = defaultIntentRouter.selectModules(
      "what is the weather like",
      chatModules,
      ctx,
    );
    const names = selected.map((m) => m.name);
    for (const required of ["profile", "safeguarding", "handoff"]) {
      assert.ok(names.includes(required), `router dropped always-on module ${required}`);
    }
  });

  test("router falls back to all modules on an ambiguous turn", () => {
    const selected = defaultIntentRouter.selectModules("xyzzy", chatModules, ctx);
    assert.equal(selected.length, chatModules.length);
  });

  test("router narrows to a keyword-matched module plus always-on modules", () => {
    const selected = defaultIntentRouter.selectModules(
      "I need wheelchair transport pricing",
      chatModules,
      ctx,
    );
    const names = selected.map((m) => m.name);
    assert.ok(names.includes("transport"), "expected transport module to match");
    assert.ok(names.includes("safeguarding"), "expected always-on safeguarding retained");
    assert.ok(selected.length < chatModules.length, "expected narrowing, not full fallback");
  });

  test("escalate_to_human persists a handoff and acknowledges success", async () => {
    const created: any[] = [];
    const fakeCtx = {
      sessionId: "s1",
      userId: "u1",
      channel: "web",
      storage: {
        createChatHandoff: async (data: any) => {
          created.push(data);
          return { id: "handoff-1", ...data };
        },
      },
    } as unknown as ChatContext;

    const raw = await handoffModule.handlers.escalate_to_human({ reason: "stuck" }, fakeCtx);
    const out = JSON.parse(raw);
    assert.equal(out.escalated, true);
    assert.equal(out.handoffId, "handoff-1");
    assert.equal(out.status, "requested");
    assert.equal(created.length, 1);
    assert.equal(created[0].sessionId, "s1");
  });

  test("escalate_to_human fails closed when persistence throws", async () => {
    const fakeCtx = {
      sessionId: "s1",
      userId: "u1",
      channel: "web",
      storage: {
        createChatHandoff: async () => {
          throw new Error("db down");
        },
      },
    } as unknown as ChatContext;

    const raw = await handoffModule.handlers.escalate_to_human({ reason: "stuck" }, fakeCtx);
    const out = JSON.parse(raw);
    assert.equal(out.escalated, false, "must not claim escalation succeeded when DB insert failed");
    assert.equal(out.handoffId, null);
    assert.equal(out.status, "error");
  });
});

describe("ndis claim money casting", () => {
  test("casts string decimal money fields to numbers without NaN", () => {
    const raw = {
      id: "c1",
      quantity: "2.00",
      unitPrice: "70.23",
      totalAmount: "140.46",
      itemCode: "01_011_0107_1_1",
      status: "submitted",
    } as unknown as NdisClaim;

    const c = toNumericNdisClaim(raw);
    assert.equal(typeof c.quantity, "number");
    assert.equal(typeof c.unitPrice, "number");
    assert.equal(typeof c.totalAmount, "number");
    assert.equal(c.quantity * c.unitPrice, 140.46);
    assert.ok(!Number.isNaN(c.totalAmount));
    // non-money fields are preserved verbatim
    assert.equal(c.itemCode, "01_011_0107_1_1");
    assert.equal(c.status, "submitted");
  });

  test("toNumericNdisClaims sums totals without NaN", () => {
    const rows = [
      { totalAmount: "10.50", quantity: "1", unitPrice: "10.50" },
      { totalAmount: "5.25", quantity: "1", unitPrice: "5.25" },
    ] as unknown as NdisClaim[];
    const total = toNumericNdisClaims(rows).reduce((s, c) => s + c.totalAmount, 0);
    assert.equal(total, 15.75);
  });
});
