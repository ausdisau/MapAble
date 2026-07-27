/**
 * Orb usage-metering client for mapableau-new.
 *
 * Drop-in replacement for the REPL's server/orb.ts, rewritten against the
 * mapableau-new stack (no Express, uses process.env directly — same as REPL,
 * since Vercel exposes secrets as env vars).
 *
 * Usage:
 *   import { ingestCareHoursEvent, ingestTransportKmEvent } from "@/lib/orb/client";
 *
 * Required environment variables (add to Vercel project settings):
 *   ORB_API_KEY           — Orb API key
 *   ORB_WEBHOOK_SECRET    — Orb webhook signing secret (for webhook verification)
 */

import Orb from "orb-billing";

export const CARE_HOURS_METRIC = "care_hours";
export const TRANSPORT_KM_METRIC = "transport_km";

let _orb: Orb | null = null;

function getOrb(): Orb {
  if (_orb) return _orb;
  const key = process.env.ORB_API_KEY;
  if (!key) throw new Error("ORB_API_KEY is not set — Orb features are unavailable");
  _orb = new Orb({ apiKey: key, webhookSecret: process.env.ORB_WEBHOOK_SECRET });
  return _orb;
}

export function orbEnabled(): boolean {
  return !!process.env.ORB_API_KEY;
}

// ---------------------------------------------------------------------------
// Customer & subscription management
// ---------------------------------------------------------------------------

export async function createOrbCustomer(
  externalId: string,
  name: string,
  email: string,
) {
  return getOrb().customers.create({ external_customer_id: externalId, name, email });
}

export async function createOrbSubscription(orbCustomerId: string) {
  const plans = await getOrb().plans.list();
  const plan = plans.data?.[0];
  if (!plan) {
    console.warn("[orb] No Orb plans found — skipping subscription creation");
    return null;
  }
  return getOrb().subscriptions.create({ customer_id: orbCustomerId, plan_id: plan.id });
}

// ---------------------------------------------------------------------------
// Usage event ingestion
// ---------------------------------------------------------------------------

export async function ingestCareHoursEvent(
  externalCustomerId: string,
  hours: number,
  tier: string,
  sessionId: string,
) {
  return getOrb().events.ingest({
    events: [
      {
        external_customer_id: externalCustomerId,
        event_name: CARE_HOURS_METRIC,
        properties: { hours, tier },
        idempotency_key: `care-session-${sessionId}`,
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

export async function ingestTransportKmEvent(
  externalCustomerId: string,
  km: number,
  tier: string,
  tripId: string,
) {
  return getOrb().events.ingest({
    events: [
      {
        external_customer_id: externalCustomerId,
        event_name: TRANSPORT_KM_METRIC,
        properties: { km, tier },
        idempotency_key: `transport-trip-${tripId}`,
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Usage retrieval
// ---------------------------------------------------------------------------

export async function getCustomerUsage(orbCustomerId: string) {
  try {
    const orb = getOrb();
    const subs = await orb.subscriptions.list({ customer_id: [orbCustomerId] });
    const activeSub = subs.data?.[0];
    if (!activeSub) return null;
    const usage = await orb.subscriptions.fetchUsage(activeSub.id);
    return {
      subscriptionId: activeSub.id,
      currentPeriodStart: activeSub.current_billing_period_start_date,
      currentPeriodEnd: activeSub.current_billing_period_end_date,
      usage: usage?.data || [],
    };
  } catch (e) {
    console.error("[orb] Failed to fetch usage:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Webhook verification
// ---------------------------------------------------------------------------

export function verifyAndUnwrapOrbWebhook(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>,
): Record<string, unknown> {
  return getOrb().webhooks.unwrap(
    rawBody,
    headers,
    process.env.ORB_WEBHOOK_SECRET,
  ) as Record<string, unknown>;
}
