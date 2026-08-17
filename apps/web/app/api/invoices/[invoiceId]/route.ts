import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: true,
      preflightResults: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!invoice) return jsonError("Not found", 404);

  if (!isAdminRole(user.primaryRole) && invoice.participantId !== user.id) {
    if (invoice.organisationId) {
      const member = await prisma.organisationMember.findFirst({
        where: { userId: user.id, organisationId: invoice.organisationId },
      });
      if (!member) return jsonError("Forbidden", 403);
    } else {
      return jsonError("Forbidden", 403);
    }
  }

  return jsonOk({ invoice });
}
