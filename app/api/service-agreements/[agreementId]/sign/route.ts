import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { signServiceAgreement } from "@/lib/contracts/service-agreements/agreement-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agreementId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { agreementId } = await params;
  const body = await req.json();
  const agreement = await prisma.serviceAgreement.findUnique({
    where: { id: agreementId },
  });
  if (!agreement) return jsonError("Not found", 404);

  const role =
    body.role === "provider"
      ? "provider"
      : agreement.participantId === user.id
        ? "participant"
        : null;
  if (!role) return jsonError("Forbidden", 403);

  const updated = await signServiceAgreement({
    agreementId,
    signerUserId: user.id,
    role,
  });
  return jsonOk({ agreement: updated });
}
