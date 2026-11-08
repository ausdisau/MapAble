import { requireApiPermission } from "@/lib/api/auth-handler";
import { listCalendarEvents } from "@/lib/calendar/calendar-service";
import {
  DAY_TIMEZONE,
  parseCalendarDay,
  projectCalendarDay,
} from "@/lib/day/calendar-read";

export const dynamic = "force-dynamic";

/**
 * Optional explicit self-calendar read, separately gated from the synthetic
 * Day preview. Never accepts a participant ID, tenant, delegate or write body.
 */
export async function GET(request: Request) {
  const user = await requireApiPermission("calendar:read:self");
  if (user instanceof Response) return user;

  if (
    process.env.MAPABLE_DAY_DEMO_ENABLED !== "true" ||
    process.env.MAPABLE_DAY_READ_CALENDAR_ENABLED !== "true"
  ) {
    return Response.json(
      { error: "FEATURE_DISABLED" },
      { status: 404, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const url = new URL(request.url);
  if (url.searchParams.getAll("date").length > 1) {
    return Response.json({ error: "INVALID_DAY" }, { status: 400 });
  }

  const selection = parseCalendarDay(url.searchParams.get("date"));
  if (!selection) {
    return Response.json({ error: "INVALID_DAY" }, { status: 400 });
  }

  try {
    const records = await listCalendarEvents({
      participantId: user.id,
      from: selection.from,
      to: selection.to,
    });

    const projected = projectCalendarDay(records, selection.day);
    return Response.json(
      {
        day: selection.day,
        timezone: DAY_TIMEZONE,
        source: "mapable_calendar",
        readOnly: true,
        message:
          "These are recorded calendar entries, not verification of care, worker eligibility, transport compatibility or service completion.",
        ...projected,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch {
    return Response.json(
      { error: "CALENDAR_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
