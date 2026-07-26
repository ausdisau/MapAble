import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  createSandboxApp,
  testSandboxWebhook,
} from "@/lib/partner/sandbox/sandbox-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const apps = await prisma.partnerSandboxApp.findMany({ take: 20 });
  return jsonOk({ apps });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.action === "test_webhook") {
    const delivery = await testSandboxWebhook(body.appId, body.eventType);
    return jsonOk({ delivery });
  }
  const app = await createSandboxApp(body.name ?? "Test sandbox app", user.id);
  return jsonOk({ app }, 201);
}
