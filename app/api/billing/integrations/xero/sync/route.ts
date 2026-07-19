import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { syncInvoiceToXero } from "@/lib/billing/integrations/xero-facade";
import { xeroSyncSchema } from "@/lib/billing/schemas";

export async function POST(req: Request) {
  const user = await requireBillingPermission("billing:manage_integrations");
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => ({}));
  const parsed = xeroSyncSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await syncInvoiceToXero({
      invoiceId: parsed.data.invoiceId,
      organisationId: parsed.data.organisationId,
      actorId: user.id,
      actorRole: user.primaryRole,
      idempotencyKey: parsed.data.idempotencyKey,
    });
    return jsonOk(result, result.ok ? 200 : 400);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Xero sync failed",
      400
    );
  }
}
