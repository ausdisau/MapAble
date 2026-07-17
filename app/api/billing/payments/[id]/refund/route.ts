import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { refundPaymentStub } from "@/lib/billing/payments/service";
import { refundPaymentStubSchema } from "@/lib/billing/schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireBillingPermission("billing:record_payment");
  if (isResponse(user)) return user;

  const { id: paymentId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = refundPaymentStubSchema.safeParse({
    ...body,
    paymentId,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const payment = await refundPaymentStub({
      paymentId: parsed.data.paymentId,
      amountCents: parsed.data.amountCents,
      actorId: user.id,
      actorRole: user.primaryRole,
      reason: parsed.data.reason,
    });
    return jsonOk({ payment, simulated: true });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Refund payment failed",
      400
    );
  }
}
