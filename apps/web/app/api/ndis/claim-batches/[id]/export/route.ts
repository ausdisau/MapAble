import { requireApiPermission } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk } from "@/lib/api/response";
import {
  assertOrgAccess,
  exportClaimBatch,
} from "@/lib/ndis/claiming/claim-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("provider:ndis:claim");
  if (isResponse(user)) return user;

  const { id } = await params;
  const batch = await prisma.ndisClaimBatch.findUnique({ where: { id } });
  if (!batch) return jsonError("Batch not found", 404);

  try {
    await assertOrgAccess(user, batch.providerOrgId);
    const result = await exportClaimBatch(id, user.id);
    return jsonOk({
      ...result,
      message:
        "Export ready. Upload NDIA-managed CSV files manually in myplace. MapAble does not store government portal passwords.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Export failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (msg === "PROVIDER_REGISTRATION_REQUIRED") {
      return jsonError("Provider NDIS registration number is required", 400);
    }
    return jsonError(msg, 400);
  }
}
