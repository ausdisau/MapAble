import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireConvergenceFeature } from "@/lib/convergence-os/gates";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const gated = requireConvergenceFeature("capabilityCatalogue");
  if (gated) return gated;

  const { searchParams } = new URL(req.url);
  const maturity = searchParams.get("maturity");

  const capabilities = await prisma.platformCapability.findMany({
    where: maturity ? { maturity: maturity as never } : undefined,
    orderBy: [{ programme: "asc" }, { name: "asc" }],
  });

  return jsonOk({ capabilities });
}
