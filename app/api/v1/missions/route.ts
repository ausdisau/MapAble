import { withV1Auth } from "@/lib/platform/api/v1-handler";
import { apiSuccessResponse } from "@/lib/platform/api/errors";
import { parseCursorParams, buildCursorPage } from "@/lib/platform/api/pagination";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  return withV1Auth(
    req,
    {
      requiredScope: "bookings_read",
      requireParticipantId: true,
      participantDomain: "coordination",
      participantAction: "read",
    },
    async (ctx) => {
      const { limit } = parseCursorParams(new URL(req.url).searchParams);

      if (ctx.client.environment === "sandbox") {
        return apiSuccessResponse({
          missions: [
            {
              id: "mission_sandbox_001",
              title: "Sandbox coordination mission",
              missionType: "coordination",
              synthetic: true,
            },
          ],
          page: buildCursorPage([], limit),
        });
      }

      const missions = await prisma.careOSMission.findMany({
        where: { participantId: ctx.participantId! },
        take: limit + 1,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          missionType: true,
          status: true,
          requestId: true,
          createdAt: true,
        },
      });

      const page = buildCursorPage(missions, limit);
      return apiSuccessResponse({ missions: page.items, page });
    },
  );
}
