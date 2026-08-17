import { z } from "zod";

import { prisma } from "@/lib/prisma";

import type { CareOSToolDefinition } from "./tool-definition";

const inputSchema = z.object({ destination: z.string().trim().min(1) });
const outputSchema = z.object({
  evidence: z.array(
    z.object({
      placeId: z.string(),
      placeName: z.string(),
      sourceType: z.string(),
      sourceDate: z.string(),
      confidence: z.string(),
      summary: z.string(),
    })
  ),
});

export const readAccessEvidenceTool: CareOSToolDefinition<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = {
  name: "read_access_evidence",
  description: "Reads recorded destination accessibility evidence without inventing missing facts.",
  module: "access",
  risk: "read",
  inputSchema,
  outputSchema,
  requiredPermissions: ["accessibility_map:read"],
  requiredConsentScopes: ["access.place_evidence"],
  authorityLevel: "L0_INFORMATION",
  requiresParticipantConfirmation: false,
  async execute(input) {
    const places = await prisma.accessPlace.findMany({
      where: {
        status: "published",
        OR: [
          { name: { contains: input.destination, mode: "insensitive" } },
          { addressText: { contains: input.destination, mode: "insensitive" } },
        ],
      },
      take: 5,
    });
    return {
      evidence: places.map((place) => ({
        placeId: place.id,
        placeName: place.name,
        sourceType: place.sourceType,
        sourceDate: place.updatedAt.toISOString(),
        confidence: place.confidence,
        summary: place.description ?? "No detailed accessibility summary is available.",
      })),
    };
  },
};
