import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk } from "@/lib/api/response";
import { createCustomerPortalSession } from "@/lib/billing/core/subscription-service";

export async function POST() {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  const result = await createCustomerPortalSession(user.id);
  if (!result.ok) return jsonError(result.error ?? "Portal unavailable", 400);
  return jsonOk({ portalUrl: result.portalUrl });
}
