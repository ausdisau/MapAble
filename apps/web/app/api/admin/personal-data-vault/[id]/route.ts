import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  approveVaultRequest,
  completeVaultRequest,
  rejectVaultRequest,
} from "@/lib/personal-data-vault/vault-service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { id } = await params;
  const body = await req.json();
  const action = body.action as string;

  try {
    if (action === "approve") {
      const request = await approveVaultRequest(id, user.id);
      return jsonOk({ request });
    }
    if (action === "reject") {
      const request = await rejectVaultRequest(
        id,
        body.reason ?? "Rejected by admin",
        user.id
      );
      return jsonOk({ request });
    }
    if (action === "complete") {
      const request = await completeVaultRequest(id, user.id);
      return jsonOk({ request });
    }
    return jsonError("INVALID_ACTION", 400);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "VAULT_ACTION_FAILED", 400);
  }
}
