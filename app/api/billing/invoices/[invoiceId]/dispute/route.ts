import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isResponse } from "@/lib/billing/api-helpers";
import { disputeBillingInvoice } from "@/lib/billing/core/transparent-billing";
import { disputeInvoiceSchema } from "@/lib/billing/schemas";

/**
 * Participant dispute — session required (no dedicated billing:dispute_* perm).
 * Matches issue/void/send: safeParse + jsonOk/jsonError with e.message.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;

  const { invoiceId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = disputeInvoiceSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const invoice = await disputeBillingInvoice(
      invoiceId,
      user.id,
      parsed.data.reason
    );
    return jsonOk({ invoice });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Dispute failed",
      400
    );
  }
}
