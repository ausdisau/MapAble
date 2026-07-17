import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  isParticipantAccessHistoryEnabled,
  isTrustFabricEnabled,
} from "@/lib/config/trust-fabric";
import {
  listParticipantAccessHistory,
  TrustFabricError,
} from "@/lib/trust-fabric/receipt-service";

export async function GET() {
  if (!isTrustFabricEnabled() || !isParticipantAccessHistoryEnabled()) {
    return jsonError("Participant access history is not enabled", 503);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const history = await listParticipantAccessHistory(user.id, user.id);
    return jsonOk({
      history,
      publicClaimState: "internal_alpha",
      notice:
        "This history shows who viewed your information categories and why. It does not expose security internals.",
    });
  } catch (err) {
    if (err instanceof TrustFabricError) {
      return jsonError(err.message, err.status);
    }
    throw err;
  }
}
