import { z } from "zod";

import { prisma } from "@/lib/prisma";

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
    const events = await prisma.calendarEvent.findMany({
      where: {
        participantId: context.participant.participantId,
        startAt: { gte: input.after ? new Date(input.after) : new Date() },
        ...(input.query
          ? { title: { contains: input.query, mode: "insensitive" } }
          : {}),
      },
      select: { id: true, title: true, startAt: true, endAt: true, timezone: true },
      orderBy: { startAt: "asc" },
      take: 10,
    });
    return {
      appointments: events.map((event) => ({
        ...event,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt.toISOString(),
      })),
    };
  },
};
