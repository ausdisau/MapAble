import { withV1Auth } from "@/lib/platform/api/v1-handler";
import { apiSuccessResponse } from "@/lib/platform/api/errors";
import { parseCursorParams, buildCursorPage } from "@/lib/platform/api/pagination";
import { assertSandboxSafe, syntheticParticipantStub } from "@/lib/platform/api/sandbox-guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  return withV1Auth(
    req,
    {
      requiredScope: "providers_read",
      requireParticipantId: true,
      participantDomain: "care",
      participantAction: "read",
    },
    async (ctx) => {
      assertSandboxSafe(ctx.client.environment, "Participant");
      const { searchParams } = new URL(req.url);
      const { limit } = parseCursorParams(searchParams);

      if (ctx.client.environment === "sandbox") {
        return apiSuccessResponse({
          participants: [syntheticParticipantStub(ctx.participantId!)],
          page: buildCursorPage([], limit),
        });
      }

      const grants = await prisma.participantAuthorityGrant.findMany({
        where: {
          participantId: ctx.participantId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        take: limit + 1,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          participantId: true,
          domain: true,
          actions: true,
          expiresAt: true,
          createdAt: true,
        },
      });

      const page = buildCursorPage(
        grants.map((g) => ({ ...g, id: g.id, createdAt: g.createdAt })),
        limit,
      );

      return apiSuccessResponse({
        participants: [{ id: ctx.participantId, authorityDomains: page.items.map((g) => g.domain) }],
        page,
      });
    },
  );
}
