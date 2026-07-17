import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/convergence-os/gates";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ domainId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("domainRegistry");
  if (gated) return gated;

  const { domainId } = await context.params;
  const domain = await prisma.canonicalDomain.findFirst({
    where: {
      OR: [{ id: domainId }, { domainKey: domainId }],
    },
    include: {
      versions: { orderBy: { version: "desc" } },
    },
  });

  if (!domain) return jsonError("Domain not found", 404);
  return jsonOk({ domain });
}
