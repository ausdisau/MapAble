import { requireApiPermission } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk } from "@/lib/api/response";
import {
  assertOrgAccess,
  validateClaimBatch,
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
    const result = await validateClaimBatch(id);
    if (!result.ok) return jsonError(result.error ?? "Failed", 400);
    return jsonOk(result);
  } catch {
    return jsonError("Forbidden", 403);
  }
}
