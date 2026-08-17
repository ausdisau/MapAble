import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { dryRunProviderClaim } from "@/lib/ndis/provider-claiming/claim-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ claimId: string }> }
) {
  const user = await requireApiPermission("provider:ndia:claim");
  if (user instanceof Response) return user;
  const { claimId } = await params;

  try {
    const result = await dryRunProviderClaim(claimId, user);
    return jsonOk(result);
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Claim not found", 404);
    }
    throw e;
  }
}
