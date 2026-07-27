import { test, before, after, describe, type TestContext } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// Environment must be configured BEFORE app modules are imported: the Stripe
// client in server/stripe.ts is constructed at module load from
// STRIPE_SECRET_KEY. All Stripe SDK calls are mocked per-test below — the key
// is a dummy and no network calls are made.
//
// NOTE: several tests toggle process.env flags (STRIPE_BECS_DISABLED,
// STRIPE_CONNECT_ENABLED). node:test runs tests in this file serially by
// default — do NOT enable test concurrency for this file, or those env
// mutations will race across tests.
// ---------------------------------------------------------------------------
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_dummy_payments_tests";
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_dummy";
delete process.env.STRIPE_BECS_DISABLED;
delete process.env.STRIPE_CONNECT_ENABLED;
// Guarantee PRODA is NOT configured so the 503 fallback paths are exercised.
delete process.env.NDIS_PRODA_BASE_URL;
delete process.env.NDIS_PRODA_CLIENT_ID;
delete process.env.NDIS_PRODA_CLIENT_SECRET;
delete process.env.NDIS_PRODA_DEVICE_NAME;
delete process.env.NDIS_PRODA_ORG_ID;

// Loaded dynamically in before() so the env above is applied first.
let server: import("./helpers").TestServer;
let storage: typeof import("../storage").storage;
let getStripe: typeof import("../stripe").getStripe;

before(async () => {
  const helpers = await import("./helpers");
  ({ storage } = await import("../storage"));
  ({ getStripe } = await import("../stripe"));
  server = await helpers.startTestServer();
});

after(async () => {
  await server?.close();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function req(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<{ status: number; json: any; text: string; setCookie: string | null }> {
  const res = await fetch(`${server.baseUrl}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text, setCookie: res.headers.get("set-cookie") };
}

const participantUser = {
  id: "user-participant-1",
  username: "pat",
  password: "plain-pw", // no ":" -> login uses plain comparison
  role: "participant",
  fullName: "Pat Participant",
  email: "pat@example.com",
  stripeCustomerId: "cus_existing_123",
  ndisNumber: "430000001",
  autoDebitEnabled: false,
  autoDebitGraceDays: 3,
  defaultBecsPaymentMethodId: null,
} as any;

/**
 * Authenticate a session for `user` by mocking storage.getUserByUsername and
 * driving the real /api/auth/login route. Returns a Cookie header value.
 */
async function loginAs(t: TestContext, user: any): Promise<string> {
  t.mock.method(storage, "getUserByUsername", async () => user);
  const res = await req("POST", "/api/auth/login", { username: user.username, password: user.password });
  assert.equal(res.status, 200, `login failed: ${res.text}`);
  assert.ok(res.setCookie, "login must set a session cookie");
  return res.setCookie!.split(";")[0];
}

/** Build a minimal Stripe event envelope. */
function stripeEvent(id: string, type: string, object: any): any {
  return { id, type, data: { object } };
}

/** Mock webhooks.constructEvent to return (or throw) and POST the webhook. */
async function postStripeWebhook(t: TestContext, eventOrError: any) {
  t.mock.method(getStripe().webhooks, "constructEvent", () => {
    if (eventOrError instanceof Error) throw eventOrError;
    return eventOrError;
  });
  return req("POST", "/api/webhooks/stripe", {}, { "stripe-signature": "t=1,v1=test" });
}

// ---------------------------------------------------------------------------
// Stripe webhook idempotency
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/stripe — idempotency", () => {
  test("rejects an invalid signature with 400 and never claims the event", async (t) => {
    const claim = t.mock.method(storage, "claimWebhookEvent", async () => true);
    const res = await postStripeWebhook(t, new Error("No signatures found"));
    assert.equal(res.status, 400);
    assert.match(res.text, /Webhook Error: No signatures found/);
    assert.equal(claim.mock.callCount(), 0);
  });

  test("processes an event once and suppresses the duplicate delivery", async (t) => {
    let claims = 0;
    const claim = t.mock.method(storage, "claimWebhookEvent", async () => {
      claims += 1;
      return claims === 1; // first delivery claims, duplicate does not
    });
    const update = t.mock.method(storage, "updateBecsMandateStatus", async () => undefined as any);
    const release = t.mock.method(storage, "releaseWebhookEvent", async () => undefined as any);

    const event = stripeEvent("evt_dup_1", "mandate.updated", {
      id: "mandate_abc",
      status: "active",
      payment_method: "pm_abc",
    });

    const first = await postStripeWebhook(t, event);
    assert.equal(first.status, 200);
    assert.deepEqual(first.json, { received: true });
    assert.equal(update.mock.callCount(), 1);
    assert.deepEqual(update.mock.calls[0].arguments.slice(0, 2), ["pm_abc", "active"]);

    const second = await postStripeWebhook(t, event);
    assert.equal(second.status, 200);
    assert.deepEqual(second.json, { received: true, duplicate: true });
    // Side-effects must NOT run again on the duplicate.
    assert.equal(update.mock.callCount(), 1);
    assert.equal(claim.mock.callCount(), 2);
    assert.deepEqual(claim.mock.calls[0].arguments, ["evt_dup_1", "mandate.updated"]);
    // Successful processing must never release the claim.
    assert.equal(release.mock.callCount(), 0);
  });

  test("releases the claim for retry when the handler fails", async (t) => {
    t.mock.method(storage, "claimWebhookEvent", async () => true);
    t.mock.method(storage, "updateBecsMandateStatus", async () => {
      throw new Error("db unavailable");
    });
    const release = t.mock.method(storage, "releaseWebhookEvent", async () => undefined as any);

    const event = stripeEvent("evt_fail_1", "mandate.updated", {
      id: "mandate_x",
      status: "inactive",
      payment_method: "pm_x",
    });
    const res = await postStripeWebhook(t, event);
    assert.equal(res.status, 500);
    assert.deepEqual(res.json, { received: false, retry: true });
    assert.equal(release.mock.callCount(), 1);
    assert.deepEqual(release.mock.calls[0].arguments, ["evt_fail_1"]);
  });

  test("mandate.updated maps Stripe statuses to active/revoked/pending", async (t) => {
    const cases: Array<[stripeStatus: string, expected: string]> = [
      ["active", "active"],
      ["inactive", "revoked"],
      ["pending", "pending"],
    ];
    for (const [stripeStatus, expected] of cases) {
      let claims = 0;
      t.mock.method(storage, "claimWebhookEvent", async () => (++claims, true));
      const update = t.mock.method(storage, "updateBecsMandateStatus", async () => undefined as any);
      const res = await postStripeWebhook(
        t,
        stripeEvent(`evt_map_${stripeStatus}`, "mandate.updated", {
          id: "mandate_map",
          status: stripeStatus,
          payment_method: "pm_map",
        }),
      );
      assert.equal(res.status, 200);
      assert.equal(update.mock.callCount(), 1);
      assert.deepEqual(update.mock.calls[0].arguments.slice(0, 2), ["pm_map", expected]);
    }
  });

  test("setup_intent.succeeded creates a NEW BECS mandate as pending, never active", async (t) => {
    t.mock.method(storage, "claimWebhookEvent", async () => true);
    t.mock.method(getStripe().paymentMethods, "retrieve", async () =>
      ({
        id: "pm_new",
        type: "au_becs_debit",
        au_becs_debit: { bsb_number: "082-001", last4: "4321" },
        metadata: {},
      }) as any,
    );
    t.mock.method(storage, "getBecsMandateByPaymentMethod", async () => undefined as any);
    const create = t.mock.method(storage, "createBecsMandate", async (data: any) => data);

    const res = await postStripeWebhook(
      t,
      stripeEvent("evt_si_1", "setup_intent.succeeded", {
        id: "seti_1",
        payment_method: "pm_new",
        mandate: "mandate_new",
        metadata: { userId: participantUser.id },
      }),
    );
    assert.equal(res.status, 200);
    assert.equal(create.mock.callCount(), 1);
    const arg = create.mock.calls[0].arguments[0] as any;
    assert.equal(arg.status, "pending");
    assert.equal(arg.stripePaymentMethodId, "pm_new");
    assert.equal(arg.userId, participantUser.id);
  });
});

// ---------------------------------------------------------------------------
// BECS setup intent creation
// ---------------------------------------------------------------------------

describe("POST /api/payment-methods/setup-intent", () => {
  test("rejects unauthenticated requests with 401", async () => {
    const res = await req("POST", "/api/payment-methods/setup-intent", {});
    assert.equal(res.status, 401);
  });

  test("returns 503 when BECS is disabled", async (t) => {
    const cookie = await loginAs(t, participantUser);
    process.env.STRIPE_BECS_DISABLED = "1";
    t.after(() => {
      delete process.env.STRIPE_BECS_DISABLED;
    });
    const res = await req("POST", "/api/payment-methods/setup-intent", {}, { cookie });
    assert.equal(res.status, 503);
  });

  test("creates an au_becs_debit off_session SetupIntent for an existing Stripe customer", async (t) => {
    const cookie = await loginAs(t, participantUser);
    t.mock.method(storage, "getUser", async () => participantUser);
    const customersCreate = t.mock.method(getStripe().customers, "create", async () =>
      ({ id: "cus_should_not_be_created" }) as any,
    );
    const setupCreate = t.mock.method(getStripe().setupIntents, "create", async () =>
      ({ id: "seti_test_1", client_secret: "seti_test_1_secret" }) as any,
    );

    const res = await req("POST", "/api/payment-methods/setup-intent", {}, { cookie });
    assert.equal(res.status, 200, res.text);
    assert.deepEqual(res.json, { clientSecret: "seti_test_1_secret", setupIntentId: "seti_test_1" });

    assert.equal(customersCreate.mock.callCount(), 0, "must reuse the existing Stripe customer");
    assert.equal(setupCreate.mock.callCount(), 1);
    const args = setupCreate.mock.calls[0].arguments[0] as any;
    assert.equal(args.customer, participantUser.stripeCustomerId);
    assert.deepEqual(args.payment_method_types, ["au_becs_debit"]);
    assert.equal(args.usage, "off_session");
    assert.equal(args.metadata.userId, participantUser.id);
  });

  test("creates and persists a Stripe customer when the user has none", async (t) => {
    const noCustomer = { ...participantUser, stripeCustomerId: null };
    const cookie = await loginAs(t, noCustomer);
    t.mock.method(storage, "getUser", async () => noCustomer);
    t.mock.method(getStripe().customers, "create", async () => ({ id: "cus_created_9" }) as any);
    const persist = t.mock.method(storage, "updateUserStripeCustomerId", async () => undefined as any);
    const setupCreate = t.mock.method(getStripe().setupIntents, "create", async () =>
      ({ id: "seti_test_2", client_secret: "seti_test_2_secret" }) as any,
    );

    const res = await req("POST", "/api/payment-methods/setup-intent", {}, { cookie });
    assert.equal(res.status, 200, res.text);
    assert.equal(persist.mock.callCount(), 1);
    assert.deepEqual(persist.mock.calls[0].arguments, [noCustomer.id, "cus_created_9"]);
    assert.equal((setupCreate.mock.calls[0].arguments[0] as any).customer, "cus_created_9");
  });
});

// ---------------------------------------------------------------------------
// Auto-debit toggle
// ---------------------------------------------------------------------------

describe("PUT /api/billing/auto-debit", () => {
  test("rejects a non-boolean enabled flag with 400", async (t) => {
    const cookie = await loginAs(t, participantUser);
    const res = await req("PUT", "/api/billing/auto-debit", { enabled: "yes" }, { cookie });
    assert.equal(res.status, 400);
  });

  test("refuses to enable auto-debit without a default BECS mandate", async (t) => {
    const cookie = await loginAs(t, participantUser);
    t.mock.method(storage, "getDefaultBecsMandate", async () => undefined as any);
    const setAuto = t.mock.method(storage, "setUserAutoDebit", async () => participantUser);
    const res = await req("PUT", "/api/billing/auto-debit", { enabled: true }, { cookie });
    assert.equal(res.status, 400);
    assert.match(res.json.message, /default BECS/i);
    assert.equal(setAuto.mock.callCount(), 0);
  });

  test("enables auto-debit with a default mandate and persists graceDays", async (t) => {
    const cookie = await loginAs(t, participantUser);
    t.mock.method(storage, "getDefaultBecsMandate", async () =>
      ({ id: "bm_1", stripePaymentMethodId: "pm_1", status: "active", isDefault: true }) as any,
    );
    const setAuto = t.mock.method(storage, "setUserAutoDebit", async () =>
      ({ ...participantUser, autoDebitEnabled: true, autoDebitGraceDays: 5 }) as any,
    );
    const res = await req("PUT", "/api/billing/auto-debit", { enabled: true, graceDays: 5 }, { cookie });
    assert.equal(res.status, 200, res.text);
    assert.deepEqual(res.json, { autoDebitEnabled: true, autoDebitGraceDays: 5 });
    assert.deepEqual(setAuto.mock.calls[0].arguments, [participantUser.id, true, 5]);
  });

  test("disabling auto-debit does not require a default mandate", async (t) => {
    const cookie = await loginAs(t, participantUser);
    const getDefault = t.mock.method(storage, "getDefaultBecsMandate", async () => undefined as any);
    t.mock.method(storage, "setUserAutoDebit", async () =>
      ({ ...participantUser, autoDebitEnabled: false, autoDebitGraceDays: 3 }) as any,
    );
    const res = await req("PUT", "/api/billing/auto-debit", { enabled: false }, { cookie });
    assert.equal(res.status, 200, res.text);
    assert.deepEqual(res.json, { autoDebitEnabled: false, autoDebitGraceDays: 3 });
    assert.equal(getDefault.mock.callCount(), 0);
  });
});

// ---------------------------------------------------------------------------
// Payouts onboarding — ABN gating
// ---------------------------------------------------------------------------

describe("POST /api/payouts/onboard — ABN gating", () => {
  function withConnect(t: TestContext) {
    process.env.STRIPE_CONNECT_ENABLED = "1";
    t.after(() => {
      delete process.env.STRIPE_CONNECT_ENABLED;
    });
  }

  const carerUser = { ...participantUser, id: "user-carer-1", username: "cara", role: "carer" };
  const providerUser = {
    ...participantUser,
    id: "user-provider-1",
    username: "prov",
    role: "provider",
    abn: "51824753556",
    abnVerified: true,
    stripeAccountId: null,
  };

  test("returns 503 when Stripe Connect is not enabled", async (t) => {
    const cookie = await loginAs(t, carerUser);
    const res = await req("POST", "/api/payouts/onboard", {}, { cookie });
    assert.equal(res.status, 503);
  });

  test("participants cannot onboard for payouts (403)", async (t) => {
    withConnect(t);
    const cookie = await loginAs(t, participantUser);
    t.mock.method(storage, "getUser", async () => participantUser);
    const res = await req("POST", "/api/payouts/onboard", {}, { cookie });
    assert.equal(res.status, 403);
  });

  test("carer with an unverified ABN is blocked with 400", async (t) => {
    withConnect(t);
    const cookie = await loginAs(t, carerUser);
    t.mock.method(storage, "getUser", async () => carerUser);
    t.mock.method(storage, "getWorkerByUserId", async () => ({ id: "w1", abnVerified: false }) as any);
    const accountsCreate = t.mock.method(getStripe().accounts, "create", async () => ({ id: "acct_no" }) as any);
    const res = await req("POST", "/api/payouts/onboard", {}, { cookie });
    assert.equal(res.status, 400);
    assert.match(res.json.message, /ABN must be verified/i);
    assert.equal(accountsCreate.mock.callCount(), 0);
  });

  test("provider without a verified ABN is blocked with 400", async (t) => {
    withConnect(t);
    const unverifiedProvider = { ...providerUser, abnVerified: false };
    const cookie = await loginAs(t, unverifiedProvider);
    t.mock.method(storage, "getUser", async () => unverifiedProvider);
    const res = await req("POST", "/api/payouts/onboard", {}, { cookie });
    assert.equal(res.status, 400);
    assert.match(res.json.message, /ABN must be verified/i);
  });

  test("carer with a verified ABN gets an Express account and onboarding link", async (t) => {
    withConnect(t);
    const verifiedCarer = { ...carerUser, stripeAccountId: null };
    const cookie = await loginAs(t, verifiedCarer);
    t.mock.method(storage, "getUser", async () => verifiedCarer);
    t.mock.method(storage, "getWorkerByUserId", async () => ({ id: "w1", abnVerified: true }) as any);
    const accountsCreate = t.mock.method(getStripe().accounts, "create", async () => ({ id: "acct_new_1" }) as any);
    const setAccount = t.mock.method(storage, "setStripeAccount", async () => verifiedCarer as any);
    t.mock.method(getStripe().accountLinks, "create", async () =>
      ({ url: "https://connect.stripe.com/setup/test" }) as any,
    );

    const res = await req("POST", "/api/payouts/onboard", {}, { cookie });
    assert.equal(res.status, 200, res.text);
    assert.deepEqual(res.json, { url: "https://connect.stripe.com/setup/test", accountId: "acct_new_1" });
    assert.equal(accountsCreate.mock.callCount(), 1);
    assert.equal((accountsCreate.mock.calls[0].arguments[0] as any).country, "AU");
    assert.equal(setAccount.mock.callCount(), 1);
    assert.equal((setAccount.mock.calls[0].arguments[1] as any).stripeAccountStatus, "pending");
  });

  test("verified provider with an existing account reuses it (no accounts.create)", async (t) => {
    withConnect(t);
    const existingProvider = { ...providerUser, stripeAccountId: "acct_existing_7" };
    const cookie = await loginAs(t, existingProvider);
    t.mock.method(storage, "getUser", async () => existingProvider);
    const accountsCreate = t.mock.method(getStripe().accounts, "create", async () => ({ id: "acct_no" }) as any);
    t.mock.method(getStripe().accountLinks, "create", async () =>
      ({ url: "https://connect.stripe.com/setup/existing" }) as any,
    );

    const res = await req("POST", "/api/payouts/onboard", {}, { cookie });
    assert.equal(res.status, 200, res.text);
    assert.deepEqual(res.json, { url: "https://connect.stripe.com/setup/existing", accountId: "acct_existing_7" });
    assert.equal(accountsCreate.mock.callCount(), 0);
  });
});

// ---------------------------------------------------------------------------
// PRODA not-configured fallback (server/routes/scheduling-ndis.ts)
// ---------------------------------------------------------------------------

describe("NDIS PRODA fallback when not configured", () => {
  test("GET /api/ndis/price-guide returns 503 with the missing env vars", async (t) => {
    const cookie = await loginAs(t, participantUser);
    const res = await req("GET", "/api/ndis/price-guide", undefined, { cookie });
    assert.equal(res.status, 503, res.text);
    assert.match(res.json.message, /PRODA not configured/i);
    assert.ok(Array.isArray(res.json.missingEnvVars) && res.json.missingEnvVars.length > 0);
  });

  test("POST /api/ndis/sync-plan returns 503 when PRODA is not configured", async (t) => {
    const cookie = await loginAs(t, participantUser);
    t.mock.method(storage, "getUser", async () => participantUser);
    const res = await req("POST", "/api/ndis/sync-plan", {}, { cookie });
    assert.equal(res.status, 503, res.text);
    assert.match(res.json.message, /PRODA not configured/i);
  });

  test("POST /api/ndis/sync-plan returns 400 when the user has no NDIS number", async (t) => {
    const noNdis = { ...participantUser, ndisNumber: null };
    const cookie = await loginAs(t, noNdis);
    t.mock.method(storage, "getUser", async () => noNdis);
    const res = await req("POST", "/api/ndis/sync-plan", {}, { cookie });
    assert.equal(res.status, 400, res.text);
    assert.match(res.json.message, /no NDIS number/i);
  });

  test("POST /api/ndis/validate-rate returns 503 when PRODA is not configured", async (t) => {
    const cookie = await loginAs(t, participantUser);
    const res = await req(
      "POST",
      "/api/ndis/validate-rate",
      { itemCode: "01_011_0107_1_1", rate: 65 },
      { cookie },
    );
    assert.equal(res.status, 503, res.text);
    assert.match(res.json.message, /PRODA not configured/i);
  });
});
