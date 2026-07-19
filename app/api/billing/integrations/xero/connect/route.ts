import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  assertCanAccessBillingOrganisation,
  BillingAccessError,
} from "@/lib/billing/access";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { connectXero } from "@/lib/billing/integrations/xero-facade";
import { xeroConnectSchema } from "@/lib/billing/schemas";
import { BreakGlassRequiredError } from "@/lib/security/break-glass";

export async function POST(req: Request) {
  const user = await requireBillingPermission("billing:manage_integrations");
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => ({}));
  const parsed = xeroConnectSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  if (!parsed.data.organisationId) {
    return jsonError("organisationId required", 400);
  }
  const organisationId = parsed.data.organisationId;

  try {
    await assertCanAccessBillingOrganisation(user, organisationId);
    const result = await connectXero({
      organisationId,
      actorId: user.id,
      actorRole: user.primaryRole,
    });
    return jsonOk(result, result.ok ? 200 : 400);
  } catch (e) {
    if (e instanceof BreakGlassRequiredError) {
      return jsonError(e.message, e.status);
    }
    if (e instanceof BillingAccessError) {
      return jsonError("Forbidden", e.status);
    }
    return jsonError(
      e instanceof Error ? e.message : "Xero connect failed",
      400
    );
  }
}
