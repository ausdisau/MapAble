import { apiSuccessResponse } from "@/lib/platform/api/errors";
import { parseCursorParams, buildCursorPage } from "@/lib/platform/api/pagination";
import { withV1Auth } from "@/lib/platform/api/v1-handler";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  return withV1Auth(
    req,
    {
      requiredScope: "bookings_read",
      requireParticipantId: true,
      participantDomain: "transport",
      participantAction: "read",
    },
    async (ctx) => {
      const { limit } = parseCursorParams(new URL(req.url).searchParams);

      if (ctx.client.environment === "sandbox") {
        return apiSuccessResponse({
          trips: [
            {
              id: "trip_sandbox_001",
              status: "requested",
              synthetic: true,
            },
          ],
          page: buildCursorPage([], limit),
        });
      }

      const trips = await prisma.transportTrip.findMany({
        where: { participantId: ctx.participantId! },
        take: limit + 1,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          scheduledStart: true,
          createdAt: true,
        },
      });

      const page = buildCursorPage(trips, limit);
      return apiSuccessResponse({ trips: page.items, page });
    },
  );
}
