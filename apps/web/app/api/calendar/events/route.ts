import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listCalendarEvents } from "@/lib/calendar/calendar-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiPermission("calendar:read:self");
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const events = await listCalendarEvents({
    participantId: user.id,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });
  return jsonOk({ events });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("calendar:read:self");
  if (user instanceof Response) return user;
  const body = await req.json();
  const event = await prisma.calendarEvent.create({
    data: {
      eventType: body.eventType,
      title: body.title,
      description: body.description,
      startAt: new Date(body.startAt),
      endAt: new Date(body.endAt),
      timezone: body.timezone ?? "Australia/Sydney",
      participantId: user.id,
      createdById: user.id,
      externalSyncPlaceholder: true,
    },
  });
  return jsonOk({ event }, 201);
}
