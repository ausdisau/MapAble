import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { updateHomeLivingProfile } from "@/lib/home-living/home-living-service";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  desiredLivingArrangements: z.array(z.string()).default([]),
  preferredLocations: z.array(z.string()).default([]),
  accessibilityRequirements: z.array(z.string()).default([]),
  communicationRequirements: z.array(z.string()).default([]),
  privacyPreferences: z.array(z.string()).default([]),
  dignityOfRiskChoices: z.array(z.string()).default([]),
  nonNegotiables: z.array(z.string()).default([]),
});

export async function GET() {
  const participant = await requireApiSession();
  if (participant instanceof Response) return participant;
  return jsonOk({
    profile: await prisma.homeLivingProfile.findUnique({
      where: { participantId: participant.id },
    }),
  });
}

export async function PATCH(request: Request) {
  const participant = await requireApiSession();
  if (participant instanceof Response) return participant;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  return jsonOk({
    profile: await updateHomeLivingProfile({
      participantId: participant.id,
      actorUserId: participant.id,
      ...parsed.data,
    }),
  });
}
