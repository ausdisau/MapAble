import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { transitionInvoice } from "@/lib/billing/invoicing/issue";
import { sendInvoiceSchema } from "@/lib/billing/schemas";
import { prisma } from "@/lib/prisma";
import type { BillingInvoiceState } from "@/types/billing";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireBillingPermission("billing:issue_invoice");
  if (isResponse(user)) return user;

  const { invoiceId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = sendInvoiceSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await prisma.billingInvoice.findUnique({
    where: { id: invoiceId },
  });
  if (!existing) return jsonError("Invoice not found", 404);

  try {
    const { invoice, transition } = await transitionInvoice({
      invoiceId,
      to: "sent" as BillingInvoiceState,
      actorId: user.id,
      actorRole: user.primaryRole,
      reason: parsed.data.reason ?? "Invoice sent",
      organisationId: existing.providerId,
    });

    const delivery = await prisma.billingInvoiceDelivery.create({
      data: {
        invoiceId,
        channel: parsed.data.channel ?? "email",
        recipient: parsed.data.recipient,
        status: "sent",
        sentAt: new Date(),
        payload: {
          actorId: user.id,
          transitionTo: transition.newState,
        },
      },
    });

    return jsonOk({ invoice, delivery, transition });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Send invoice failed",
      400
    );
  }
}
