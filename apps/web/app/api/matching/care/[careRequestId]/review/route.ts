import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getLatestMatchRunForCareRequest } from "@/lib/matching/matching-service";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ careRequestId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { careRequestId } = await params;

  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
  });
  if (!request) return jsonError("Not found", 404);

  if (
    user.primaryRole !== "participant" &&
    user.primaryRole !== "mapable_admin" &&
    user.primaryRole !== "support_coordinator"
  ) {
    return jsonError("Forbidden", 403);
  }

  if (user.primaryRole === "participant" && request.participantId !== user.id) {
    return jsonError("Forbidden", 403);
  }

  const run = await getLatestMatchRunForCareRequest(careRequestId);
  return jsonOk({ run, careRequest: request });
}
