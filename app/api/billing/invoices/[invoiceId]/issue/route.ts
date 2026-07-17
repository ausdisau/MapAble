import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { issueInvoice } from "@/lib/billing/invoicing/issue";
import { issueInvoiceSchema } from "@/lib/billing/schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireBillingPermission("billing:issue_invoice");
  if (isResponse(user)) return user;

  const { invoiceId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = issueInvoiceSchema.safeParse({
    ...body,
    invoiceId,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const invoice = await issueInvoice({
      invoiceId: parsed.data.invoiceId,
      actorId: user.id,
      actorRole: user.primaryRole,
      reason: parsed.data.reason,
    });
    return jsonOk({ invoice });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Issue invoice failed",
      400
    );
  }
}
