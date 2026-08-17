import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createParticipantGoal } from "@/lib/marketplace/participant-marketplace-service";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  category: z.enum([
    "care",
    "transport",
    "employment",
    "education",
    "home_and_living",
    "community",
    "rehabilitation",
    "food",
    "health_access",
    "other",
  ]),
  desiredBy: z.string().datetime().optional(),
  importance: z.enum(["low", "medium", "high"]).optional(),
  participantLanguage: z.string().min(1).max(2000),
});

export async function GET() {
  const participant = await requireApiSession();
  if (participant instanceof Response) return participant;
  return jsonOk({
    goals: await prisma.participantGoal.findMany({
      where: { participantId: participant.id },
      orderBy: { updatedAt: "desc" },
    }),
  });
}

export async function POST(request: Request) {
  const participant = await requireApiSession();
  if (participant instanceof Response) return participant;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  return jsonOk(
    {
      goal: await createParticipantGoal({
        participantId: participant.id,
        ...parsed.data,
        desiredBy: parsed.data.desiredBy
          ? new Date(parsed.data.desiredBy)
          : undefined,
      }),
    },
    201,
  );
}
