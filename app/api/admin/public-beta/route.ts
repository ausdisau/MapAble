import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getBetaCohortSummary } from "@/lib/platform/public-beta/beta-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const cohortId = new URL(req.url).searchParams.get("cohortId");
  const cohorts = await prisma.publicBetaCohort.findMany({
    orderBy: { createdAt: "desc" },
  });
  if (cohortId) {
    return jsonOk({ summary: await getBetaCohortSummary(cohortId) });
  }
  return jsonOk({ cohorts });
}
