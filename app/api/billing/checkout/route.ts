import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createCheckoutForInvoice } from "@/lib/billing/core/checkout-service";
import { checkoutSchema } from "@/lib/billing/core/schemas";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await createCheckoutForInvoice(user.id, parsed.data.invoiceId);
  if (!result.ok) {
    if ("decision" in result && result.decision) {
      return jsonOk({ checkout: result.decision }, 200);
    }
    return jsonError(result.error ?? "Checkout failed", 400);
  }
  return jsonOk({
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId,
  });
}
