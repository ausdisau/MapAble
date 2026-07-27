import { listCalendarEvents } from "@/lib/calendar/calendar-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { getMobilityPrefillForUser } from "@/lib/transport/profile-prefill-service";

import type {
  AppointmentSummary,
  JourneyPlanRequest,
  MapAbleIntelligenceContext,
} from "./types";

function toAppointmentSummary(event: {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  timezone: string;
}): AppointmentSummary {
  return {
    id: event.id,
    eventType: event.eventType,
    title: event.title,
    description: event.description,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    timezone: event.timezone,
  };
}

export async function buildMapAbleIntelligenceContext(
  user: CurrentUser,
  request: JourneyPlanRequest
): Promise<MapAbleIntelligenceContext> {
  const now = new Date();
  const horizon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const events = await listCalendarEvents({
    participantId: user.id,
    from: now,
    to: horizon,
  });

  const appointments = events.map(toAppointmentSummary);
  const selectedAppointment = request.appointmentId
    ? appointments.find((event) => event.id === request.appointmentId) ?? null
    : appointments[0] ?? null;

  const prefill = request.useAccessibilityProfile
    ? await getMobilityPrefillForUser(user)
    : {
        mobilityRequirements: {},
        accessNotes: undefined,
        fromProfile: false,
      };

  return {
    user,
    appointments,
    selectedAppointment,
    mobilityRequirements: prefill.mobilityRequirements,
    accessNotes: prefill.accessNotes,
    profileUsed: prefill.fromProfile,
    plainLanguage: request.plainLanguage,
  };
}
