import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { transitionInvoice } from "@/lib/billing/invoicing/issue";
import { voidInvoiceSchema } from "@/lib/billing/schemas";
import { prisma } from "@/lib/prisma";
import type { BillingInvoiceState } from "@/types/billing";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireBillingPermission("billing:void_invoice");
  if (isResponse(user)) return user;

  const { invoiceId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = voidInvoiceSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await prisma.billingInvoice.findUnique({
    where: { id: invoiceId },
  });
  if (!existing) return jsonError("Invoice not found", 404);

  try {
    const result = await transitionInvoice({
      invoiceId,
      to: "void" as BillingInvoiceState,
      actorId: user.id,
      actorRole: user.primaryRole,
      reason: parsed.data.reason,
      organisationId: existing.providerId,
    });
    return jsonOk(result);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Void invoice failed",
      400
    );
  }
}
