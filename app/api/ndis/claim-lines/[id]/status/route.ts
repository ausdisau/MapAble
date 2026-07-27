import { requireApiPermission } from "@/lib/api/auth-handler";
import {
  isResponse,
  jsonError,
  jsonOk,
  zodErrorResponse,
} from "@/lib/api/response";
import {
  assertOrgAccess,
  correctAndResubmitClaimLine,
  updateClaimLineStatus,
} from "@/lib/ndis/claiming/claim-service";
import type { ClaimLineStatusUpdate } from "@/lib/ndis/claiming/types";
import { updateClaimLineStatusSchema } from "@/lib/ndis/schemas";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("provider:ndis:claim");
  if (isResponse(user)) return user;

  const { id } = await params;
  const parsed = updateClaimLineStatusSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const line = await prisma.ndisClaimLine.findUnique({ where: { id } });
  if (!line) return jsonError("Claim line not found", 404);

  try {
    await assertOrgAccess(user, line.providerOrgId);

    if (parsed.data.status === "resubmitted" && parsed.data.resubmit) {
      const result = await correctAndResubmitClaimLine({
        originalLineId: id,
        corrections: parsed.data.resubmit,
        actorUserId: user.id,
      });
      return jsonOk(result);
    }

    const updated = await updateClaimLineStatus({
      lineId: id,
      status: parsed.data.status as ClaimLineStatusUpdate,
      actorUserId: user.id,
      rejectionCode: parsed.data.rejectionCode,
      rejectionMessage: parsed.data.rejectionMessage,
    });
    return jsonOk({ line: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (msg === "LINE_NOT_REJECTED") {
      return jsonError(
        "Only rejected lines can be resubmitted with corrections",
        400
      );
    }
    return jsonError(msg, 400);
  }
}
