import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk } from "@/lib/api/response";
import { refreshConnectOnboardingLink } from "@/lib/billing/core/connect-service";

export async function POST() {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  const result = await refreshConnectOnboardingLink(user.id, "provider");
  if (!result.ok) return jsonError(result.error ?? "Onboarding link failed", 503);
  return jsonOk({ onboardingUrl: result.onboardingUrl });
}
