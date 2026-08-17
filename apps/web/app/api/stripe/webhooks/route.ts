import { jsonOk } from "@/lib/api/response";
import { isStripeIntegrationEnabled } from "@/lib/stripe/config";
import { parseAndProcessWebhookRequest } from "@/lib/stripe/webhooks";

export const runtime = "nodejs";

/** Legacy path — forwards to unified Stripe webhook processor. */
export async function POST(req: Request) {
  if (!isStripeIntegrationEnabled()) {
    return jsonOk({ received: false, message: "Payments not configured" });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  const result = await parseAndProcessWebhookRequest(rawBody, signature);

  if (!result.ok) {
    return jsonOk({ received: false, error: result.message }, result.status);
  }

  return jsonOk({
    received: true,
    duplicate: result.billing.duplicate || result.legacy.duplicate,
    billing: result.billing,
    legacy: result.legacy,
  });
}
