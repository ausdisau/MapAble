import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { allocatePaymentToInvoice } from "@/lib/billing/payments/service";
import { allocatePaymentSchema } from "@/lib/billing/schemas";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireBillingPermission("billing:record_payment");
  if (isResponse(user)) return user;

  const { id: paymentId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = allocatePaymentSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const payment = await prisma.billingPayment.findUnique({
    where: { id: paymentId },
  });
  if (!payment) return jsonError("Payment not found", 404);

  const invoiceId = parsed.data.invoiceId ?? payment.invoiceId;
  const amountCents = parsed.data.amountCents ?? payment.amountCents;
  const source = parsed.data.source ?? `payment:${payment.id}`;

  try {
    const allocation = await allocatePaymentToInvoice({
      invoiceId,
      amountCents,
      source,
      actorId: user.id,
      actorRole: user.primaryRole,
      organisationId: payment.providerId,
    });
    return jsonOk({ allocation });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Allocate payment failed",
      400
    );
  }
}
