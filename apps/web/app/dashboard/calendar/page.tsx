import { CalendarEventList } from "@/components/phase3/CalendarEventList";
import { requireAuth } from "@/lib/auth/guards";
import { listCalendarEvents } from "@/lib/calendar/calendar-service";

export const metadata = { title: "Calendar | MapAble Core" };

export default async function CalendarPage() {
  const user = await requireAuth();
  const events = await listCalendarEvents({ participantId: user.id });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Your calendar</h1>
        <p className="text-muted-foreground">
          List view is the default for screen reader accessibility. External
          calendar sync is not enabled in this pilot.
        </p>
      </header>
      <CalendarEventList events={events} />
    </div>
  );
}
