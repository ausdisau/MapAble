import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { submitProviderClaim } from "@/lib/ndis/provider-claiming/claim-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ claimId: string }> }
) {
  const user = await requireApiPermission("provider:ndia:claim");
  if (user instanceof Response) return user;
  const { claimId } = await params;

  try {
    const result = await submitProviderClaim(claimId, user);
    return jsonOk(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "NOT_FOUND") return jsonError("Claim not found", 404);
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (msg === "CLAIM_VALIDATION_FAILED") {
      return jsonError("Claim failed validation", 400);
    }
    if (msg === "GOVERNANCE_APPROVAL_REQUIRED") {
      return jsonError("Governance approval required for submission", 403);
    }
    if (msg === "NDIA_PROVIDER_CLAIMING_DISABLED") {
      return jsonError("NDIA provider claiming disabled", 503);
    }
    throw e;
  }
}
