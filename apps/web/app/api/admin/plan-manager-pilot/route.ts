import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { createPilotExport } from "@/lib/support/plan-manager-pilot/pilot-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const partners = await prisma.planManagerPilotPartner.findMany({
    include: { exports: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
  return jsonOk({ partners });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const result = await createPilotExport(body.partnerId);
  return jsonOk(result, 201);
}
