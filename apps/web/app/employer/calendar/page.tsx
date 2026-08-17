import { CalendarEventList } from "@/components/phase3/CalendarEventList";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function EmployerCalendarPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const events = await prisma.calendarEvent.findMany({
    where: {
      OR: [
        { organisationId: { in: orgIds } },
        { eventType: "job_interview" },
      ],
    },
    orderBy: { startAt: "asc" },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Employer calendar</h1>
      <p className="text-sm text-muted-foreground">External sync disabled in pilot.</p>
      <CalendarEventList events={events} />
    </div>
  );
}
