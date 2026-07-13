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
    eventType: event