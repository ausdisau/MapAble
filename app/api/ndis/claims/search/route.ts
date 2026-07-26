import { NdisClaimLineStatus, NdisPaymentRoute } from "@prisma/client";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { assertOrgAccess, searchClaimLines } from "@/lib/ndis/claiming/claim-service";

export async function GET(req: Request) {
  const user = await requireApiPermission("provider:ndis:claim");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  let providerOrgId = url.searchParams.get("providerOrgId") ?? undefined;
  if (!providerOrgId && !isAdminRole(user.primaryRole)) {
    const orgIds = await getUserOrganisationIds(user.id);
    providerOrgId = orgIds[0];
  }
  if (!providerOrgId) {
    return jsonError("providerOrgId is required", 400);
  }

  try {
    await assertOrgAccess(user, providerOrgId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError(msg, 400);
  }

  const status = url.searchParams.get("status") as NdisClaimLineStatus | null;
  const paymentRoute = url.searchParams.get(
    "paymentRoute"
  ) as NdisPaymentRoute | null;
  const q = url.searchParams.get("q") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? "50");

  const lines = await searchClaimLines({
    providerOrgId,
    status: status ?? undefined,
    paymentRoute: paymentRoute ?? undefined,
    q,
    limit: Number.isFinite(limit) ? limit : 50,
  });

  return jsonOk({ lines });
}
