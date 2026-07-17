import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { BillingAccessError } from "@/lib/billing/access";
import { isProviderOpsEnabled } from "@/lib/config/provider-ops";
import {
  buildProviderAttentionQueue,
  ProviderOpsError,
} from "@/lib/provider-ops/attention-queue";
import { BreakGlassRequiredError } from "@/lib/security/break-glass";

export async function GET(req: Request) {
  if (!isProviderOpsEnabled()) {
    return jsonError("Provider Operations is not enabled", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const organisationId = new URL(req.url).searchParams.get("organisationId");
  if (!organisationId) {
    return jsonError("organisationId required", 400);
  }

  try {
    const queue = await buildProviderAttentionQueue({
      user,
      organisationId,
    });
    return jsonOk({
      queue,
      notice:
        "Read-only projection. Resolve items in Care, Transport, Billing, Workforce, or Continuity — not here.",
    });
  } catch (err) {
    if (err instanceof ProviderOpsError) {
      return jsonError(err.message, err.status);
    }
    if (err instanceof BillingAccessError) {
      return jsonError(err.message, err.status);
    }
    if (err instanceof BreakGlassRequiredError) {
      return jsonError(err.message, err.status);
    }
    throw err;
  }
}
