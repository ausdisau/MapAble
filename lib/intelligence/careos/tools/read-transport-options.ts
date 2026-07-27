import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { buildParticipantRightsSnapshot } from "../context/participant-rights";

import type { CareOSToolDefinition } from "./tool-definition";

const inputSchema = z.object({});
const outputSchema = z.object({
  vehicles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      organisationId: z.string(),
      wheelchairAccessible: z.boolean(),
      rampAvailable: z.boolean(),
      liftAvailable: z.boolean(),
      hoistAvailable: z.boolean(),
      hardConstraintsSatisfied: z.literal(true),
    })
  ),
});

export const readTransportOptionsTool: CareOSToolDefinition<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = {
  name: "read_transport_options",
  description: "Reads active transport vehicles compatible with hard access requirements.",
  module: "transport",
  risk: "read",
  inputSchema,
  outputSchema,
  requiredPermissions: ["transport:read:self"],
  requiredConsentScopes: ["transport.location"],
  authorityLevel: "L2_RECOMMEND",
  requiresParticipantConfirmation: false,
  async execute(_input, context) {
    const rights = await buildParticipantRightsSnapshot(context.participant.participantId);
    const vehicles = await prisma.transportVehicle.findMany({
      where: { active: true, organisation: { status: "active", verificationStatus: "verified" } },
      include: { features: true },
      take: 50,
    });
    return {
      vehicles: vehicles
        .filter((vehicle) => !rights.blockedProviderIds.includes(vehicle.organisationId))
        .map((vehicle) => {
          const feature = vehicle.features[0];
          return {
            id: vehicle.id,
            name: vehicle.displayName,
            organisationId: vehicle.organisationId,
            wheelchairAccessible: feature?.wheelchairAccessible ?? false,
            rampAvailable: feature?.rampAvailable ?? false,
            liftAvailable: feature?.liftAvailable ?? false,
            hoistAvailable: feature?.hoistAvailable ?? false,
          };
        })
        .filter((vehicle) => {
          if (rights.mobilityAidType?.includes("wheelchair") && !vehicle.wheelchairAccessible) {
            return false;
          }
          if (rights.requiredVehicleFeatures.includes("ramp") && !vehicle.rampAvailable) return false;
          if (rights.requiredVehicleFeatures.includes("lift") && !vehicle.liftAvailable) return false;
          if (rights.requiredVehicleFeatures.includes("hoist") && !vehicle.hoistAvailable) return false;
          return true;
        })
        .map((vehicle) => ({ ...vehicle, hardConstraintsSatisfied: true as const })),
    };
  },
};
