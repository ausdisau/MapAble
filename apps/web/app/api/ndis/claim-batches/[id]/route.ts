import { requireApiPermission } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk } from "@/lib/api/response";
import { assertOrgAccess } from "@/lib/ndis/claiming/claim-service";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("provider:ndis:claim");
  if (isResponse(user)) return user;

  const { id } = await params;
  const batch = await prisma.ndisClaimBatch.findUnique({
    where: { id },
    include: {
      lines: {
        orderBy: { serviceStartDate: "asc" },
        select: {
          id: true,
          status: true,
          participantName: true,
          supportItemCode: true,
          serviceStartDate: true,
          serviceEndDate: true,
          totalAmountCents: true,
          rejectionCode: true,
          rejectionMessage: true,
        },
      },
    },
  });

  if (!batch) return jsonError("Batch not found", 404);

  try {
    await assertOrgAccess(user, batch.providerOrgId);
    return jsonOk({ batch });
  } catch {
    return jsonError("Forbidden", 403);
  }
}
