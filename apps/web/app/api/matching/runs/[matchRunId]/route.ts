import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchRunId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { matchRunId } = await params;
  const run = await prisma.matchRun.findUnique({
    where: { id: matchRunId },
    include: {
      candidates: { include: { factors: true }, orderBy: { score: "desc" } },
    },
  });
  if (!run) return jsonError("Not found", 404);
  return jsonOk({ run });
}
