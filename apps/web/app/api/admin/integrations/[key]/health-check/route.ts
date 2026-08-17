import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { runIntegrationHealthCheck } from "@/lib/integrations/integration-health-service";
import { getIntegrationPublic } from "@/lib/integrations/integration-registry";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { key } = await params;
  try {
    const health = await runIntegrationHealthCheck(key, user.id);
    const integration = await getIntegrationPublic(key);
    return NextResponse.json({ health, integration });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Health check failed",
      },
      { status: 400 }
    );
  }
}
