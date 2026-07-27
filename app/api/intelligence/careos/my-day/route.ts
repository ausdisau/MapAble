import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { careOSFeatureFlags } from "@/lib/intelligence/careos/config/feature-flags";
import { CareOSConsentError } from "@/lib/intelligence/careos/consent/consent-service";
import { buildCareOSContext } from "@/lib/intelligence/careos/context/context-builder";
import { createCareOSToolRegistry } from "@/lib/intelligence/careos/tools";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!careOSFeatureFlags.enabled || !careOSFeatureFlags.coreEnabled) {
    return jsonError("FEATURE_DISABLED", 503);
  }
  try {
    const context = await buildCareOSContext({ user });
    const today = await createCareOSToolRegistry().execute(
      "read_my_day_summary",
      {},
      context
    );
    return jsonOk({ today, requestId: context.requestId });
  } catch (error) {
    if (error instanceof CareOSConsentError) {
      return jsonOk(
        { error: "CONSENT_REQUIRED", missingScopes: error.missingScopes },
        403
      );
    }
    return jsonError("SERVICE_UNAVAILABLE", 503);
  }
}
