import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createConnectAccountAndLink } from "@/lib/billing/core/connect-service";

export async function POST() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const result = await createConnectAccountAndLink(user.id, "provider");
  if (!result.ok) return jsonError(result.error ?? "Connect failed", 503);
  return jsonOk({
    onboardingUrl: result.onboardingUrl,
    stripeConnectedAccountId: result.accountId,
  });
}
