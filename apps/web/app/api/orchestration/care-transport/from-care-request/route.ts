import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createLinkedTransportFromCareRequest } from "@/lib/orchestration/care-transport-orchestrator";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { careRequestId } = await req.json();
  if (!careRequestId) return jsonError("careRequestId required", 400);

  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
  });
  if (!request || request.participantId !== user.id) {
    return jsonError("Not found", 404);
  }

  try {
    const result = await createLinkedTransportFromCareRequest(
      careRequestId,
      user.id
    );
    return jsonOk(result);
  } catch (e) {
    if (e instanceof Error && e.message === "LINK_NOT_REQUESTED") {
      return jsonError("Linked transport not requested on this care request", 400);
    }
    return jsonError("Orchestration failed", 500);
  }
}
