import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createCheckoutForInvoice } from "@/lib/billing/core/checkout-service";
import { checkPriceRules } from "@/lib/payouts/price-rules";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  invoiceId: z.string(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const invoice = await prisma.billingInvoice.findFirst({
    where: { id: parsed.data.invoiceId, userId: user.id },
    include: { lineItems: true, fundingSource: true },
  });
  if (!invoice) return jsonError("Invoice not found", 404);

  const priceCheck = checkPriceRules({
    lineItems: invoice.lineItems.map((li) => ({
      description: li.description,
      unitAmountCents: li.unitAmountCents,
      quantity: Number(li.quantity),
      ndisLineItemCode: li.ndisLineItem ?? undefined,
    })),
    bookingType: invoice.serviceType,
    fundingSourceType: invoice.fundingSource?.type ?? "other",
  });
  if (!priceCheck.pass) {
    return jsonError(priceCheck.reasons.join(" "), 400);
  }

  const result = await createCheckoutForInvoice(user.id, invoice.id);
  if (!result.ok) {
    const errMsg =
      "error" in result && result.error
        ? result.error
        : "Checkout not available";
    return jsonError(errMsg, 400);
  }

  return jsonOk({
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId,
    warnings: priceCheck.warnings,
  });
}
