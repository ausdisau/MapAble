import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { withAuthorization } from "@/lib/auth/withAuthorization";
import { approveInvoice } from "@/lib/billing/invoicing/issue";
import { approveInvoiceSchema } from "@/lib/billing/schemas";

type RouteParams = { params: Promise<{ invoiceId: string }> };

/**
 * Invoice approval — billing/admin permission required
 * (`billing:approve_participant` or `billing:approve_provider`).
 */
export const POST = withAuthorization(
  {
    roles: [
      "ADMIN",
      "mapable_admin",
      "PLAN_MANAGER",
      "plan_manager",
      "PROVIDER",
      "provider_admin",
      "PARTICIPANT",
      "participant",
    ],
    permissions: [
      "billing:approve_participant",
      "billing:approve_provider",
    ],
    requireAnyPermission: true,
  },
  async (req, context, user) => {
    const { invoiceId } = await (context as RouteParams).params;
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
        400,
      );
    }
  },
);
