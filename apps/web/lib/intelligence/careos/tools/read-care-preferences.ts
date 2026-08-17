import { z } from "zod";

import { prisma } from "@/lib/prisma";

import type { CareOSToolDefinition } from "./tool-definition";

const inputSchema = z.object({});
const outputSchema = z.object({
  preferences: z.array(z.object({ key: z.string(), value: z.unknown() })),
});

export const readCarePreferencesTool: CareOSToolDefinition<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = {
  name: "read_care_preferences",
  description: "Reads participant-confirmed care preferences.",
  module: "care",
  risk: "read",
  inputSchema,
  outputSchema,
  requiredPermissions: ["care:read:self"],
  requiredConsentScopes: ["care.preferences"],
  authorityLevel: "L0_INFORMATION",
  requiresParticipantConfirmation: false,
  async execute(_input, context) {
    const preferences = await prisma.careParticipantPreference.findMany({
      where: { participantId: context.participant.participantId },
      select: { preferenceKey: true, value: true },
      orderBy: { updatedAt: "desc" },
    });
    return {
      preferences: preferences.map((preference) => ({
        key: preference.preferenceKey,
        value: preference.value,
      })),
    };
  },
};
