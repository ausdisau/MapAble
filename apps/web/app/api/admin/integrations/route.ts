import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { listIntegrationsPublic } from "@/lib/integrations/integration-registry";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const integrations = await listIntegrationsPublic();
  return NextResponse.json({ integrations });
}
