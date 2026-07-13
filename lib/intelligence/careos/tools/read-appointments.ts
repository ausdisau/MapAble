import { z } from "zod";

import { listCalendarEvents } from "@/lib/calendar/calendar-service";

import type { CareOSToolDefinition } from "./tool-definition";

const inputSchema = z.object({
  after: z.string().datetime().optional(),
  query: z.string().trim().min(1).optional(),
});
const outputSchema = z.object({
  appointments: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      startAt: z.string(),
      endAt: z.string(),
      timezone: z.string(),
    })
  ),
});

export const readUpcomingAppointmentsTool: CareOSToolDefinition<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = {
  name: "read_upcoming_appointments",
  description: "Reads the participant's upcoming calendar appointments.",
  module: "core",
  risk: "read",
  inputSchema,
  outputSchema,
  requiredPermissions: ["calendar:read:self"],
  requiredConsentScopes: ["care.schedule"],
  authorityLevel: "L0_INFORMATION",
  requiresParticipantConfirmation: false,
  async execute(input, context) {
    const events = await listCalendarEvents({
      participantId: context.participant.participantId,
      from: input.after ? new Date(input.after) : new Date(),
    });
    return {
      appointments: events
        .filter((event) =>
          input.query
            ? event.title.toLowerCase().includes(input.query.toLowerCase())
            : true
        )
        .slice(0, 10)
        .map((event) => ({
          id: event.id,
          title: event.title,
          startAt: event.startAt.toISOString(),
          endAt: event.endAt.toISOString(),
          timezone: event.timezone,
        })),
    };
  },
};
