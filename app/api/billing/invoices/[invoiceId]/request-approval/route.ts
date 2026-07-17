import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { requestApproval } from "@/lib/billing/invoicing/issue";
import { requestApprovalSchema } from "@/lib/billing/schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireBillingPermission("billing:edit_draft");
  if (isResponse(user)) return user;

  const { invoiceId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = requestApprovalSchema.safeParse({
    ...body,
    invoiceId,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await requestApproval({
      invoiceId: parsed.data.invoiceId,
      approvalType: parsed.data.approvalType,
      actorId: user.id,
      actorRole: user.primaryRole,
      reason: parsed.data.reason,
    });
    return jsonOk(result);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Request approval failed",
      400
    );
  }
}
