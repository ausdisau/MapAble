import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { getIntegrationPublic } from "@/lib/integrations/integration-registry";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { key } = await params;
  const integration = await getIntegrationPublic(key);
  if (!integration) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ integration });
}
