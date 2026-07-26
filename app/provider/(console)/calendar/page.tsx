import { CalendarEventList } from "@/components/phase3/CalendarEventList";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requireAuth } from "@/lib/auth/guards";
import { listCalendarEvents } from "@/lib/calendar/calendar-service";

export default async function ProviderCalendarPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const events = await listCalendarEvents({
    organisationId: orgIds[0],
  });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Provider calendar</h1>
      <CalendarEventList events={events} />
    </div>
  );
}
