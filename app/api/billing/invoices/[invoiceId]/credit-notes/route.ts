import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { createCreditNote } from "@/lib/billing/invoicing/credit-note";
import { createCreditNoteSchema } from "@/lib/billing/schemas";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireBillingPermission("billing:create_credit_note");
  if (isResponse(user)) return user;

  const { invoiceId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = createCreditNoteSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const invoice = await prisma.billingInvoice.findUnique({
    where: { id: invoiceId },
  });
  if (!invoice) return jsonError("Invoice not found", 404);

  try {
    const creditNote = await createCreditNote({
      invoiceId,
      amountCents: parsed.data.amountCents,
      reason: parsed.data.reason,
      actorId: user.id,
      actorRole: user.primaryRole,
      lineItemIds: parsed.data.lineItemIds,
      organisationId: invoice.providerId,
      transitionInvoice: parsed.data.transitionInvoice,
    });
    return jsonOk({ creditNote }, 201);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Create credit note failed",
      400
    );
  }
}
