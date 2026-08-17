import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { auditIntegrationAction } from "@/lib/integrations/integration-audit-service";
import { updateIntegrationSettings } from "@/lib/integrations/integration-connection-service";
import { getIntegrationPublic } from "@/lib/integrations/integration-registry";

const patchSchema = z.object({
  status: z.enum(["disabled", "enabled", "degraded", "error"]).optional(),
  environment: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { key } = await params;
  const body = patchSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  await updateIntegrationSettings(key, {
    status: body.data.status,
    environment: body.data.environment,
    connectedById: user.id,
  });

  await auditIntegrationAction({
    integrationKey: key,
    action: "settings_updated",
    actorUserId: user.id,
    metadata: body.data,
  });

  const integration = await getIntegrationPublic(key);
  return NextResponse.json({ integration });
}
