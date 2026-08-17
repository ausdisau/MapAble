import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { confirmMatch } from "@/lib/billing/reconciliation/service";
import { confirmMatchSchema } from "@/lib/billing/schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireBillingPermission("billing:reconcile");
  if (isResponse(user)) return user;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = confirmMatchSchema.safeParse({
    ...body,
    matchId: id,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const match = await confirmMatch({
      matchId: parsed.data.matchId,
      actorId: user.id,
      actorRole: user.primaryRole,
      notes: parsed.data.notes,
    });
    return jsonOk({ match });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Confirm match failed",
      400
    );
  }
}
