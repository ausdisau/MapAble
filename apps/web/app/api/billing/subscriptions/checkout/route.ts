import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { subscriptionCheckoutSchema } from "@/lib/billing/core/schemas";
import { createSubscriptionCheckout } from "@/lib/billing/core/subscription-service";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  const body = await req.json();
  const parsed = subscriptionCheckoutSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await createSubscriptionCheckout(
    user.id,
    parsed.data.planCode
  );
  if (!result.ok) return jsonError(result.error ?? "Subscription checkout failed", 400);
  return jsonOk({
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId,
  });
}
