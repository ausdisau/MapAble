import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createPaymentIntentPlaceholder } from "@/lib/stripe/stripe-service";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { invoiceId, amountCents } = await req.json();
  if (!invoiceId || !amountCents) {
    return jsonError("invoiceId and amountCents required");
  }

  const result = await createPaymentIntentPlaceholder({
    invoiceId,
    amountCents,
    userId: user.id,
  });

  if (!result.ok) {
    return jsonOk(result, 503);
  }
  return jsonOk(result);
}
