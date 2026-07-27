import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, type TestServer } from "./helpers";
import { registry, defaultIntentRouter, chatModules } from "../chat";
import type { ChatContext } from "../chat";
import { handoffModule } from "../chat/modules";
import { toNumericNdisClaim, toNumericNdisClaims, type NdisClaim } from "@shared/schema";
import { buildSafeguardingSummary } from "../notifications";
import { classifyUserTurn, applyOutputGuardrails } from "../chat-guardrails";
import {
  getBucketConfig,
  isKnownBucket,
  listBucketConfigs,
  MERGED_DEFAULT_ORDER,
  UnknownBucketError,
  BucketReadOnlyError,
  assetStore,
} from "../replit_integrations/object_storage";

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

  // Mixed-domain coverage: a single turn spanning multiple domains must retain
  // the tools of EVERY matched domain — a keyword hit on one module must never
  // narrow away another matched module (router rule 3).
  test("router retains all matched modules on a mixed-domain turn (billing + shifts)", () => {
    const selected = defaultIntentRouter.selectModules(
      "what's my transport budget and can you book a shift?",
      chatModules,
      ctx,
    );
    const names = selected.map((m) => m.name);
    assert.ok(names.includes("billing"), "billing must be retained (budget keyword)");
    assert.ok(names.includes("shifts"), "shifts must be retained (shift/book keywords)");
    assert.ok(names.includes("transport"), "transport must be retained (transport keyword)");
    for (const required of ["profile", "safeguarding", "handoff"]) {
      assert.ok(names.includes(required), `always-on module ${required} dropped`);
    }
  });

  test("mixed-domain turn keeps every matched module's tools available", () => {
    const selected = defaultIntentRouter.selectModules(
      "do I owe an invoice, and also add groceries to my cart",
      chatModules,
      ctx,
    );
    const toolNames = selected
      .flatMap((m) => m.tools)
      .map((t) => (t.type === "function" ? t.function.name : ""));
    assert.ok(toolNames.includes("get_pending_invoices"), "billing tool dropped");
    assert.ok(toolNames.includes("view_grocery_cart"), "grocery tool dropped");
  });

  // Widening rule (router rule 4): fallback-to-all happens iff ZERO keyword
  // modules matched. A partial/multi-intent match narrows to the matched set
  // plus always-on — it must NOT silently widen to everything.
  test("router widens to all modules only when no keyword module matches", () => {
    const ambiguous = defaultIntentRouter.selectModules("hello there", chatModules, ctx);
    assert.equal(ambiguous.length, chatModules.length, "ambiguous turn must widen to all");

    const multiIntent = defaultIntentRouter.selectModules(
      "pay my invoice and book a shift",
      chatModules,
      ctx,
    );
    const names = multiIntent.map((m) => m.name);
    assert.ok(names.includes("billing") && names.includes("shifts"));
    assert.ok(
      multiIntent.length < chatModules.length,
      "multi-intent turn with matches must narrow, not fall back to all",
    );
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

describe("safeguarding alert summary safety", () => {
  const categories = [
    "immediate_danger",
    "self_harm_suicide",
    "abuse_neglect_exploitation",
    "privacy_breach",
    "safeguarding",
  ];

  test("returns a fixed, non-empty templated summary per concern type", () => {
    const seen = new Set<string>();
    for (const c of categories) {
      const summary = buildSafeguardingSummary(c);
      assert.ok(summary.length > 0, `summary for ${c} should be non-empty`);
      seen.add(summary);
    }
    // immediate_danger/self_harm/abuse/privacy each have distinct copy
    assert.ok(seen.size >= 4);
  });

  test("falls back to the generic summary for unknown concern types", () => {
    assert.equal(
      buildSafeguardingSummary("something_unexpected"),
      buildSafeguardingSummary("safeguarding"),
    );
  });

  test("summary never echoes participant free-text or PII patterns", () => {
    // The builder takes only the concern category, so raw chat text can never
    // reach the summary. Verify the templated output contains no PII-like tokens.
    for (const c of categories) {
      const summary = buildSafeguardingSummary(c);
      assert.doesNotMatch(summary, /[\w.+-]+@[\w-]+\.[\w.-]+/, "no email addresses");
      assert.doesNotMatch(summary, /\b(?:\+?61|0)[2-478](?:[ -]?\d){8}\b/, "no phone numbers");
      assert.doesNotMatch(summary, /\b\d{9,}\b/, "no long ID numbers");
    }
  });
});

describe("spoken chat guardrails (voice channel reuses text safeguards)", () => {
  // The voice route transcribes audio then hands the transcript to the same
  // processChat pipeline as text chat. These tests pin the two safety-critical
  // seams that pipeline relies on, so a spoken turn gets the identical treatment.

  test("a spoken self-harm transcript is flagged and escalated by the input classifier", () => {
    // Natural spoken phrasing, as speech-to-text would produce it.
    const verdict = classifyUserTurn("i just feel like i want to die and can't go on");
    assert.ok(verdict.categories.includes("self_harm_suicide"));
    assert.ok(verdict.categories.includes("immediate_danger"));
    assert.ok(verdict.actions.includes("flag_safeguarding_concern"));
    assert.ok(verdict.actions.includes("escalate_to_human"));
    assert.ok(verdict.policyRefs.length > 0);
  });

  test("a spoken abuse disclosure produces a safeguarding + incident draft path", () => {
    const verdict = classifyUserTurn("my support worker hit me yesterday and i feel unsafe with my worker");
    assert.ok(verdict.categories.includes("abuse_neglect_exploitation"));
    assert.ok(verdict.actions.includes("flag_safeguarding_concern"));
    assert.ok(verdict.actions.includes("log_incident_draft"));
    assert.ok(verdict.actions.includes("escalate_to_human"));
  });

  test("an unsafe response is refused before it can be spoken back", () => {
    // Output guardrails run on the assistant text BEFORE TTS synthesis, so an
    // unsafe clinical instruction can never be turned into audio.
    const unsafe = "Your diagnosis is autism and you should take 50mg of that medication.";
    const guarded = applyOutputGuardrails(unsafe);
    assert.equal(guarded.flagged, true);
    assert.ok(guarded.actions.includes("output_refusal"));
    assert.notEqual(guarded.content, unsafe);
  });

  test("a safe, on-scope response passes output guardrails unchanged", () => {
    const safe = "I can help you book accessible transport for your appointment. Would you like me to find a time?";
    const guarded = applyOutputGuardrails(safe);
    assert.equal(guarded.flagged, false);
    assert.equal(guarded.content, safe);
    assert.equal(guarded.actions.length, 0);
  });
});

describe("multi-bucket asset registry and AssetStore", () => {
  test("getBucketConfig resolves the two built-in logical buckets", () => {
    const def = getBucketConfig("default");
    assert.equal(def.name, "default");
    assert.equal(def.readOnly, false);
    assert.ok(def.bucketId.length > 0);

    const assets = getBucketConfig("assets");
    assert.equal(assets.name, "assets");
    assert.equal(assets.readOnly, false);
    assert.ok(assets.bucketId.length > 0);

    // The two logical buckets must map to distinct underlying buckets.
    assert.notEqual(def.bucketId, assets.bucketId);
  });

  test("getBucketConfig throws UnknownBucketError for an unregistered name", () => {
    assert.throws(() => getBucketConfig("does-not-exist"), UnknownBucketError);
  });

  test("isKnownBucket reflects registry membership", () => {
    assert.equal(isKnownBucket("default"), true);
    assert.equal(isKnownBucket("assets"), true);
    assert.equal(isKnownBucket("nope"), false);
  });

  test("listBucketConfigs returns both built-in buckets", () => {
    const names = listBucketConfigs().map((c) => c.name);
    assert.ok(names.includes("default"));
    assert.ok(names.includes("assets"));
  });

  test("MERGED_DEFAULT_ORDER puts assets ahead of default so assets shadow defaults", () => {
    assert.deepEqual(MERGED_DEFAULT_ORDER, ["assets", "default"]);
  });

  test("AssetStore write ops reject an unknown bucket before any I/O", async () => {
    await assert.rejects(
      () => assetStore.getSignedUploadUrl("ghost-bucket", "x/y.json"),
      UnknownBucketError,
    );
    await assert.rejects(
      () => assetStore.delete("ghost-bucket", "x/y.json"),
      UnknownBucketError,
    );
  });

  test("read-only guard: BucketReadOnlyError is thrown for a read-only bucket", () => {
    // Exercise the same guard AssetStore.assertWritable uses, without needing a
    // live network call: a read-only config must reject write intent.
    const readOnly = { name: "ro", bucketId: "b", readOnly: true } as const;
    function assertWritable(cfg: { name: string; readOnly: boolean }) {
      if (cfg.readOnly) throw new BucketReadOnlyError(cfg.name);
      return cfg;
    }
    assert.throws(() => assertWritable(readOnly), BucketReadOnlyError);
    assert.doesNotThrow(() => assertWritable({ name: "assets", readOnly: false }));
  });

  // HTTP-level authorization semantics for the public GET /assets/:bucket/*
  // route. These all short-circuit before any storage I/O, so they need no
  // live objects — they pin the access-control contract from the task spec.
  test("GET /assets rejects an unknown bucket with 400", async () => {
    const { status } = await req("GET", "/assets/ghost-bucket/public/logo.png");
    assert.equal(status, 400);
  });

  test("GET /assets rejects a key outside the bucket's public prefix with 403", async () => {
    // The default bucket's public prefix is "public"; a ".private" key must not
    // be served over the public asset route.
    const { status } = await req("GET", "/assets/default/.private/secret.json");
    assert.equal(status, 403);
  });

  test("GET /assets rejects path-traversal keys with 400", async () => {
    const { status } = await req("GET", "/assets/default/public/..%2f..%2fsecret");
    assert.equal(status, 400);
  });

  test("GET /api/assets listing is auth-gated (401 when unauthenticated)", async () => {
    const { status } = await req("GET", "/api/assets/assets");
    assert.equal(status, 401);
  });
});
