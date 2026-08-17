import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { eventId } = await params;
  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
  });
  if (!event) return jsonError("Not found", 404);
  return jsonOk({ event });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { eventId } = await params;
  const body = await req.json();
  const event = await prisma.calendarEvent.update({
    where: { id: eventId },
    data: {
      title: body.title,
      startAt: body.startAt ? new Date(body.startAt) : undefined,
      endAt: body.endAt ? new Date(body.endAt) : undefined,
    },
  });
  return jsonOk({ event });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { eventId } = await params;
  await prisma.calendarEvent.delete({ where: { id: eventId } });
  return jsonOk({ deleted: true });
}
