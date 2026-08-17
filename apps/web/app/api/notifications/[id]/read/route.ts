import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  const existing = await prisma.notification.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return jsonError("Not found", 404);

  const notification = await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });

  return jsonOk({ notification });
}
