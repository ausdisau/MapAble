import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  listPublicAccountabilityReports,
  publishAccountabilityReport,
} from "@/lib/governance/national-accountability/accountability-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const all = await prisma.nationalAccountabilityPublication.findMany({
    orderBy: { createdAt: "desc" },
  });
  return jsonOk({ published: await listPublicAccountabilityReports(), all });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const report = await publishAccountabilityReport(body);
  return jsonOk({ report }, 201);
}
