import { requireApiPermission } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk } from "@/lib/api/response";
import {
  assertOrgAccess,
  markBatchSubmittedInPortal,
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
    const updated = await markBatchSubmittedInPortal(id, user.id);
    return jsonOk({
      batch: updated,
      message:
        "Marked as submitted in portal. This records your manual submission — MapAble does not submit to myplace automatically.",
    });
  } catch {
    return jsonError("Forbidden", 403);
  }
}
