import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createTransferForPayoutSplit } from "@/lib/payouts/transfer-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAdminScope("admin:billing:read");
  if (user instanceof Response) return user;
  const { id } = await params;

  const result = await createTransferForPayoutSplit(id);
  if (!result.ok) return jsonError(result.error, 400);
  return jsonOk({ transfer: result.transfer, duplicate: result.duplicate });
}
