import { apiSuccessResponse } from "@/lib/platform/api/errors";
import { parseCursorParams, buildCursorPage } from "@/lib/platform/api/pagination";
import { withV1Auth } from "@/lib/platform/api/v1-handler";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  return withV1Auth(
    req,
    {
      requiredScope: "invoices_read",
      requireParticipantId: true,
      participantDomain: "documents",
      participantAction: "read",
    },
    async (ctx) => {
      const { limit } = parseCursorParams(new URL(req.url).searchParams);

      if (ctx.client.environment === "sandbox") {
        return apiSuccessResponse({
          documents: [
            {
              id: "doc_sandbox_001",
              title: "Sandbox consent summary",
              synthetic: true,
            },
          ],
          page: buildCursorPage([], limit),
        });
      }

      const documents = await prisma.document.findMany({
        where: { participantId: ctx.participantId! },
        take: limit + 1,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          category: true,
          createdAt: true,
        },
      });

      const page = buildCursorPage(documents, limit);
      return apiSuccessResponse({ documents: page.items, page });
    },
  );
}
