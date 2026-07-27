import { z } from "zod";

import { prisma } from "@/lib/prisma";

import type { CareOSToolDefinition } from "./tool-definition";

const inputSchema = z.object({});
const requestOutput = z.object({
  requests: z.array(z.object({ id: z.string(), status: z.string(), createdAt: z.string() })),
});
const tripOutput = z.object({
  trips: z.array(z.object({ id: z.string(), status: z.string(), startAt: z.string() })),
});

export const readExistingCareRequestsTool: CareOSToolDefinition<
  z.infer<typeof inputSchema>,
  z.infer<typeof requestOutput>
> = {
  name: "read_existing_care_requests",
  description: "Reads the participant's existing care requests.",
  module: "care",
  risk: "read",
  inputSchema,
  outputSchema: requestOutput,
  requiredPermissions: ["care:read:self"],
  requiredConsentScopes: ["care.requests"],
  authorityLevel: "L0_INFORMATION",
  requiresParticipantConfirmation: false,
  async execute(_input, context) {
    const requests = await prisma.careRequest.findMany({
      where: { participantId: context.participant.participantId },
      select: { id: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return {
      requests: requests.map((request) => ({
        id: request.id,
        status: request.status,
        createdAt: request.createdAt.toISOString(),
      })),
    };
  },
};

export const readExistingTransportRequestsTool: CareOSToolDefinition<
  z.infer<typeof inputSchema>,
  z.infer<typeof tripOutput>
> = {
  name: "read_existing_transport_requests",
  description: "Reads the participant's existing transport trips.",
  module: "transport",
  risk: "read",
  inputSchema,
  outputSchema: tripOutput,
  requiredPermissions: ["transport:read:self"],
  requiredConsentScopes: ["transport.bookings"],
  authorityLevel: "L0_INFORMATION",
  requiresParticipantConfirmation: false,
  async execute(_input, context) {
    const trips = await prisma.transportTrip.findMany({
      where: { participantId: context.participant.participantId },
      select: { id: true, status: true, scheduledStart: true },
      orderBy: { scheduledStart: "asc" },
      take: 20,
    });
    return {
      trips: trips.map((trip) => ({
        id: trip.id,
        status: trip.status,
        startAt: trip.scheduledStart.toISOString(),
      })),
    };
  },
};
