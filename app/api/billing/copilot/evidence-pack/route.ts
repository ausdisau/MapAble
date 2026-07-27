import { requireApiPermission } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk } from "@/lib/api/response";
import { isBillingCopilotEnabled } from "@/lib/billing/config";
import {
  buildBillingEvidencePack,
  type BillingEvidencePackInput,
} from "@/lib/billing/copilot/evidence-pack";

export async function POST(req: Request) {
  if (!isBillingCopilotEnabled()) {
    return jsonError("Billing Copilot is disabled", 404);
  }
  if (process.env.MAPABLE_BILLING_EVIDENCE_COPILOT_ENABLED !== "true") {
    return jsonError("Billing evidence pack surface is disabled", 404);
  }

  const user = await requireApiPermission("invoice:read:org");
  if (isResponse(user)) return user;

  const body = (await req.json().catch(() => null)) as BillingEvidencePackInput | null;
  if (!body?.invoice?.id) {
    return jsonError("invoice evidence input required", 400);
  }

  const pack = buildBillingEvidencePack(body);
  return jsonOk({
    pack,
    notice:
      "All suggestions remain editable and require human confirmation. No payment, claim, or approval was executed.",
  });
}
