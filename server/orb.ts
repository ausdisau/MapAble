import Orb from "orb-billing";

let orbClient: Orb | null = null;

if (process.env.ORB_API_KEY) {
  orbClient = new Orb({
    apiKey: process.env.ORB_API_KEY,
    webhookSecret: process.env.ORB_WEBHOOK_SECRET,
  });
} else {
  console.warn("ORB_API_KEY not set – Orb features will be unavailable");
}

export function orbEnabled(): boolean {
  return orbClient !== null;
}

function getOrb(): Orb {
  if (!orbClient) throw new Error("Orb is not configured");
  return orbClient;
}

export const CARE_HOURS_METRIC = "care_hours";
export const TRANSPORT_KM_METRIC = "transport_km";

export async function createOrbCustomer(externalId: string, name: string, email: string) {
  return getOrb().customers.create({
    external_customer_id: externalId,
    name,
    email,
  });
}

export async function createOrbSubscription(orbCustomerId: string) {
  const plans = await getOrb().plans.list();
  const plan = plans.data?.[0];
  if (!plan) {
    console.warn("No Orb plans found – skipping subscription creation");
    return null;
  }

  return getOrb().subscriptions.create({
    customer_id: orbCustomerId,
    plan_id: plan.id,
  });
}

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
    console.error("Failed to fetch Orb usage:", e);
    return null;
  }
}

export function verifyAndUnwrapWebhook(rawBody: string, headers: Record<string, string | string[] | undefined>): Record<string, unknown> {
  return getOrb().webhooks.unwrap(rawBody, headers, process.env.ORB_WEBHOOK_SECRET) as Record<string, unknown>;
}
