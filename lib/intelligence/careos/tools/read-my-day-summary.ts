import { z } from "zod";

import { listCalendarEvents } from "@/lib/calendar/calendar-service";
import { prisma } from "@/lib/prisma";

import type { CareOSToolDefinition } from "./tool-definition";

const inputSchema = z.object({});
const outputSchema = z.object({
  appointments: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      startAt: z.string(),
      endAt: z.string(),
    })
  ),
  careRequestsAwaitingResponse: z.number().int().nonnegative(),
  transportTripsUpcoming: z.number().int().nonnegative(),
  pendingRecommendations: z.number().int().nonnegative(),
});

export const readMyDaySummaryTool: CareOSToolDefinition<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = {
  name: "read_my_day_summary",
  description: "Reads a participant's upcoming day without creating or changing arrangements.",
  module: "core",
  risk: "read",
  inputSchema,
  outputSchema,
  requiredPermissions: ["calendar:read:self"],
  requiredConsentScopes: ["care.schedule"],
  authorityLevel: "L0_INFORMATION",
  requiresParticipantConfirmation: false,
  async execute(_input, context) {
    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const [events, careRequestsAwaitingResponse, transportTripsUpcoming, pendingRecommendations] =
      await Promise.all([
        listCalendarEvents({
          participantId: context.participant.participantId,
          from: start,
          to: end,
        }),
        prisma.careRequest.count({
          where: {
            participantId: context.participant.participantId,
            status: { in: ["draft", "submitted", "awaiting_provider_response"] },
          },
        }),
        prisma.transportTrip.count({
          where: {
            participantId: context.participant.participantId,
            scheduledStart: { gte: start, lte: end },
            status: { notIn: ["cancelled", "closed"] },
          },
        }),
        prisma.careOSRecommendation.count({
          where: { mission: { participantId: context.participant.participantId } },
        }),
      ]);

    return {
      appointments: events.slice(0, 10).map((event) => ({
        id: event.id,
        title: event.title,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt.toISOString(),
      })),
      careRequestsAwaitingResponse,
      transportTripsUpcoming,
      pendingRecommendations,
    };
  },
};
