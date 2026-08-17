import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireConvergenceEnabled } from "@/lib/platform/convergence-os/gates";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceEnabled();
  if (gated) return gated;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const decisions = await prisma.architectureDecision.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { decisionKey: "asc" },
  });

  return jsonOk({
    decisions,
    note: "AI-generated recommendations are labelled as proposals. Humans approve.",
  });
}
