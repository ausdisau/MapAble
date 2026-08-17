import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { submitCareRequest } from "@/lib/care/care-request-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ careRequestId: string }> }
) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const { careRequestId } = await params;

  const existing = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
  });
  if (!existing || existing.participantId !== user.id) {
    return jsonError("Not found", 404);
  }

  const result = await submitCareRequest(careRequestId, user.id);
  return jsonOk(result);
}
