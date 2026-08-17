import { CalendarEventList } from "@/components/phase3/CalendarEventList";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminCalendarPage() {
  await requireAdmin();
  const events = await prisma.calendarEvent.findMany({
    orderBy: { startAt: "asc" },
    take: 100,
  });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Admin calendar</h1>
      <CalendarEventList events={events} />
    </div>
  );
}
