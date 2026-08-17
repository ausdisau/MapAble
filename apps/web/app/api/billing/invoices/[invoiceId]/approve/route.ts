import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireAnyBillingPermission,
} from "@/lib/billing/api-helpers";
import { approveInvoice } from "@/lib/billing/invoicing/issue";
import { approveInvoiceSchema } from "@/lib/billing/schemas";

/**
 * Invoice approval — any of participant/provider approve permissions.
 * Matches issue/void/send: require* + safeParse + jsonOk/jsonError.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireAnyBillingPermission([
    "billing:approve_participant",
    "billing:approve_provider",
  ]);
  if (isResponse(user)) return user;

  const { invoiceId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = approveInvoiceSchema.safeParse({
    ...body,
    invoiceId,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const invoice = await approveInvoice({
      invoiceId: parsed.data.invoiceId,
      approvalType: parsed.data.approvalType,
      actorId: user.id,
      actorRole: user.primaryRole,
      decision: parsed.data.decision,
      reason: parsed.data.reason,
    });
    return jsonOk({ invoice });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Approve invoice failed",
      400
    );
  }
}
