import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { activatePolicyVersion } from "@/lib/billing/policy/registry";
import { activatePolicyVersionSchema } from "@/lib/billing/schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireBillingPermission("billing:manage_policy");
  if (isResponse(user)) return user;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = activatePolicyVersionSchema.safeParse({
    ...body,
    policyVersionId: body.policyVersionId ?? id,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await activatePolicyVersion({
      policyVersionId: parsed.data.policyVersionId,
      actorId: user.id,
      actorRole: user.primaryRole,
      reason: parsed.data.reason,
    });
    return jsonOk(result);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Activate policy version failed",
      400
    );
  }
}
