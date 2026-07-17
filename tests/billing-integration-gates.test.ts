import { afterEach, describe, expect, it } from "vitest";

import {
  allowPayoutWithoutPayment,
  describeIntegrationReadiness,
  isConnectPayoutsEnabled,
  isPlanManagerLiveDeliveryEnabled,
} from "@/lib/billing/config";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("billing live integration gates", () => {
  it("keeps plan-manager live off without flag and credentials", () => {
    delete process.env.BILLING_PLAN_MANAGER_LIVE;
    delete process.env.BILLING_PLAN_MANAGER_WEBHOOK_URL;
    expect(isPlanManagerLiveDeliveryEnabled()).toBe(false);
  });

  it("enables plan-manager live only with flag + delivery target", () => {
    process.env.BILLING_PLAN_MANAGER_LIVE = "true";
    process.env.BILLING_PLAN_MANAGER_WEBHOOK_URL =
      "https://example.test/plan-manager";
    expect(isPlanManagerLiveDeliveryEnabled()).toBe(true);
  });

  it("keeps Connect payouts off unless MAPABLE_PAYOUTS_ENABLED and Stripe key", () => {
    process.env.MAPABLE_PAYOUTS_ENABLED = "true";
    delete process.env.STRIPE_SECRET_KEY;
    expect(isConnectPayoutsEnabled()).toBe(false);

    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    expect(isConnectPayoutsEnabled()).toBe(true);
  });

  it("defaults allowPayoutWithoutPayment to false", () => {
    delete process.env.BILLING_ALLOW_PAYOUT_WITHOUT_PAYMENT;
    expect(allowPayoutWithoutPayment()).toBe(false);
  });

  it("describeIntegrationReadiness explains simulated defaults", () => {
    delete process.env.BILLING_PLAN_MANAGER_LIVE;
    delete process.env.MAPABLE_PAYOUTS_ENABLED;
    const readiness = describeIntegrationReadiness();
    expect(readiness.planManagerLive).toBe(false);
    expect(readiness.connectPayouts).toBe(false);
    expect(readiness.notes.length).toBeGreaterThan(0);
  });
});
