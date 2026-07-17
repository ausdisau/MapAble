import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isTrustFabricEnabled } from "@/lib/config/trust-fabric";
import { exportParticipantTrustBundle } from "@/lib/trust-fabric/export-service";
import { TrustFabricError } from "@/lib/trust-fabric/receipt-service";

export async function GET() {
  if (!isTrustFabricEnabled()) {
    return jsonError("Trust Fabric is not enabled", 503);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const bundle = await exportParticipantTrustBundle(user.id, user.id);
    return jsonOk(bundle);
  } catch (err) {
    if (err instanceof TrustFabricError) {
      return jsonError(err.message, err.status);
    }
    throw err;
  }
}
