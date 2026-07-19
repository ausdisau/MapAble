import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { recordManualPayment } from "@/lib/billing/payments/service";
import { recordManualPaymentSchema } from "@/lib/billing/schemas";

export async function POST(req: Request) {
  const user = await requireBillingPermission("billing:record_payment");
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => ({}));
  const parsed = recordManualPaymentSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await recordManualPayment({
      invoiceId: parsed.data.invoiceId,
      amountCents: parsed.data.amountCents,
      actorId: user.id,
      actorRole: user.primaryRole,
      currency: parsed.data.currency,
      externalReference: parsed.data.externalReference,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : undefined,
      reason: parsed.data.reason,
    });
    return jsonOk(result, 201);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Record payment failed",
      400
    );
  }
}
