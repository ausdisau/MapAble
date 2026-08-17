import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getGovernmentPortalSummary } from "@/lib/public/government-portal/portal-service";

export async function GET(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const workspaceId = new URL(req.url).searchParams.get("workspaceId");
  if (workspaceId) {
    try {
      return jsonOk(await getGovernmentPortalSummary(workspaceId));
    } catch {
      return jsonOk({ error: "NOT_FOUND" }, 404);
    }
  }
  const workspaces = await prisma.governmentPartnerWorkspace.findMany();
  return jsonOk({ workspaces });
}
