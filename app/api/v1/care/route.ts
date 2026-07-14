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
      participantDomain: "care",
      participantAction: "read",
    },
    async (ctx) => {
      const { limit } = parseCursorParams(new URL(req.url).searchParams);
      const orgId = ctx.client.organisationId;

      if (ctx.client.environment === "sandbox") {
        return apiSuccessResponse({
          shifts: [
            {
              id: "shift_sandbox_001",
              status: "scheduled",
              startAt: new Date().toISOString(),
              synthetic: true,
            },
          ],
          page: buildCursorPage([], limit),
        });
      }

      const shifts = await prisma.careShift.findMany({
        where: {
          participantId: ctx.participantId!,
          ...(orgId ? { organisationId: orgId } : {}),
        },
        take: limit + 1,
        orderBy: { startAt: "desc" },
        select: {
          id: true,
          organisationId: true,
          startAt: true,
          endAt: true,
          status: true,
          location: true,
          createdAt: true,
        },
      });

      const page = buildCursorPage(shifts, limit);
      return apiSuccessResponse({ shifts: page.items, page });
    },
  );
}
