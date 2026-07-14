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
      participantDomain: "employment",
      participantAction: "read",
    },
    async (ctx) => {
      const { limit } = parseCursorParams(new URL(req.url).searchParams);

      if (ctx.client.environment === "sandbox") {
        return apiSuccessResponse({
          jobs: [
            {
              id: "job_sandbox_001",
              title: "Sandbox Inclusive Role",
              synthetic: true,
            },
          ],
          page: buildCursorPage([], limit),
        });
      }

      const profile = await prisma.employmentProfile.findUnique({
        where: { participantId: ctx.participantId! },
      });

      const jobs = await prisma.job.findMany({
        where: { status: "published" },
        take: limit + 1,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          employerOrganisationId: true,
          status: true,
          createdAt: true,
        },
      });

      const page = buildCursorPage(jobs, limit);
      return apiSuccessResponse({
        jobs: page.items,
        employmentProfileId: profile?.id ?? null,
        page,
      });
    },
  );
}
