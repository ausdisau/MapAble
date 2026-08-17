import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  BillingAccessError,
  assertCanViewBillingInvoice,
} from "@/lib/billing/access";
import { isResponse } from "@/lib/billing/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  const { invoiceId } = await params;

  try {
    await assertCanViewBillingInvoice(user, invoiceId);
    const invoice = await prisma.billingInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        fundingSource: true,
        lineItems: true,
        provider: { select: { id: true, name: true, abn: true } },
      },
    });
    if (!invoice) return jsonError("Invoice not found", 404);
    return jsonOk({ invoice });
  } catch (e) {
    if (e instanceof BillingAccessError) {
      return jsonError(e.message, e.status);
    }
    return jsonError("Invoice lookup failed", 500);
  }
}
