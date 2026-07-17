import { jsonError, jsonOk } from "@/lib/api/response";
import {
  isResponse,
  requireAnyBillingPermission,
} from "@/lib/billing/api-helpers";
import {
  assertCanAccessBillingOrganisation,
  BillingAccessError,
} from "@/lib/billing/access";
import { computeBillingOverviewKpis } from "@/lib/billing/overview/kpis";
import { assertAdminTenantAccess, BreakGlassRequiredError } from "@/lib/security/break-glass";

export async function GET(req: Request) {
  const user = await requireAnyBillingPermission([
    "billing:view_own",
    "billing:view_all",
    "billing:view_provider",
  ]);
  if (isResponse(user)) return user;

  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId");
  const participantId = url.searchParams.get("participantId");

  try {
    if (organisationId) {
      assertAdminTenantAccess(user, organisationId);
      await assertCanAccessBillingOrganisation(user, organisationId);
    }

    if (participantId && participantId !== user.id) {
      // Participants may only scope to themselves unless they already passed org access
      // via provider/admin permissions above. Cross-participant IDOR: deny without org scope.
      if (!organisationId) {
        return jsonError("organisationId required when scoping another participant", 400);
      }
    }

    const kpis = await computeBillingOverviewKpis({
      organisationId: organisationId || undefined,
      participantId: participantId || undefined,
    });

    return jsonOk({ kpis });
  } catch (err) {
    if (err instanceof BillingAccessError) {
      return jsonError(err.message, err.status);
    }
    if (err instanceof BreakGlassRequiredError) {
      return jsonError(err.message, err.status);
    }
    throw err;
  }
}
