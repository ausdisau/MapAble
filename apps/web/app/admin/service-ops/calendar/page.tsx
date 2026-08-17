import { CalendarEventList } from "@/components/phase3/CalendarEventList";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminCalendarOpsPage() {
  await requireAdmin();
  const events = await prisma.calendarEvent.findMany({
    orderBy: { startAt: "asc" },
    take: 50,
  });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Operational calendar</h1>
      <CalendarEventList events={events} />
    </div>
  );
}
