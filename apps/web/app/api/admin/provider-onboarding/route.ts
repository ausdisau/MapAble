import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  completeOnboardingTask,
  startProviderOnboarding,
} from "@/lib/provider/onboarding-automation/onboarding-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const workflows = await prisma.providerOnboardingWorkflow.findMany({
    include: { tasks: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return jsonOk({ workflows });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.taskId) {
    const task = await completeOnboardingTask(body.taskId);
    return jsonOk({ task });
  }
  const workflow = await startProviderOnboarding(body.organisationId);
  return jsonOk({ workflow }, 201);
}
