import { apiSuccessResponse } from "@/lib/platform/api/errors";
import { parseCursorParams, buildCursorPage } from "@/lib/platform/api/pagination";
import { withV1Auth } from "@/lib/platform/api/v1-handler";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  return withV1Auth(
    req,
    { requiredScope: "providers_read" },
    async (ctx) => {
      const { searchParams } = new URL(req.url);
      const { limit } = parseCursorParams(searchParams);

      if (ctx.client.environment === "sandbox") {
        return apiSuccessResponse({
          organisations: [
            { id: "org_sandbox_001", name: "Sandbox Provider Co", synthetic: true },
          ],
          page: buildCursorPage([], limit),
        });
      }

      const orgId = ctx.client.organisationId;
      if (!orgId) {
        return apiSuccessResponse({ organisations: [], page: buildCursorPage([], limit) });
      }

      const org = await prisma.organisation.findUnique({
        where: { id: orgId },
        select: { id: true, name: true, createdAt: true },
      });

      const items = org ? [{ ...org, id: org.id, createdAt: org.createdAt }] : [];
      return apiSuccessResponse({
        organisations: items,
        page: buildCursorPage(items, limit),
      });
    },
  );
}
