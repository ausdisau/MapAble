import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { createReconciliationSession } from "@/lib/billing/reconciliation/service";
import { createReconciliationSessionSchema } from "@/lib/billing/schemas";

export async function POST(req: Request) {
  const user = await requireBillingPermission("billing:reconcile");
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => ({}));
  const parsed = createReconciliationSessionSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const session = await createReconciliationSession({
      organisationId: parsed.data.organisationId,
      source: parsed.data.source,
      notes: parsed.data.notes,
      actorId: user.id,
      actorRole: user.primaryRole,
      createdById: user.id,
    });
    return jsonOk({ session }, 201);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Create reconciliation session failed",
      400
    );
  }
}
