import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { publishDecisionRecord } from "@/lib/governance/public-decision-register/decision-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const records = await prisma.publicDecisionRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return jsonOk({ records });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const record = await publishDecisionRecord(body);
  return jsonOk({ record }, 201);
}
