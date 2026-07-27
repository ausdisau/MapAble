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
      participantDomain: "care",
      participantAction: "read",
    },
    async (ctx) => {
      const { limit } = parseCursorParams(new URL(req.url).searchParams);

      if (ctx.client.environment === "sandbox") {
        return apiSuccessResponse({
          events: [
            {
              id: "evt_sandbox_001",
              eventType: "care.shift.scheduled",
              synthetic: true,
            },
          ],
          page: buildCursorPage([], limit),
        });
      }

      const events = await prisma.auditEvent.findMany({
        where: { participantId: ctx.participantId! },
        take: limit + 1,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          entityType: true,
          createdAt: true,
        },
      });

      const page = buildCursorPage(events, limit);
      return apiSuccessResponse({ events: page.items, page });
    },
  );
}
