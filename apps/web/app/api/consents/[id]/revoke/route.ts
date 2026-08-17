import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { revokeConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  const consent = await prisma.consentRecord.findUnique({ where: { id } });
  if (!consent || consent.subjectUserId !== user.id) {
    return jsonError("Not found", 404);
  }

  const updated = await revokeConsent(id, user.id);
  return jsonOk({ consent: updated });
}
