import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { messageId } = await params;

  await prisma.messageReadReceipt.upsert({
    where: { messageId_userId: { messageId, userId: user.id } },
    create: { messageId, userId: user.id },
    update: { readAt: new Date() },
  });

  return jsonOk({ read: true });
}
