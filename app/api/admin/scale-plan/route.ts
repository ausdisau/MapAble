import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  approveScalePlan,
  createScalePlan,
} from "@/lib/platform/scale-plan/scale-plan-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const plans = await prisma.scalePlan.findMany({
    include: { milestones: true },
    orderBy: { createdAt: "desc" },
  });
  return jsonOk({ plans });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.planId) {
    const plan = await approveScalePlan(body.planId);
    return jsonOk({ plan });
  }
  const plan = await createScalePlan(body.title, body.summary);
  return jsonOk({ plan }, 201);
}
