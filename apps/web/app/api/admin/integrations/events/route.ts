import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { listIntegrationEvents } from "@/lib/integrations/integration-event-service";

export async function GET(request: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? "50");

  const events = await listIntegrationEvents(key, limit);
  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      integrationKey: e.connection.integrationKey,
      displayName: e.connection.displayName,
      eventType: e.eventType,
      severity: e.severity,
      message: e.message,
      createdAt: e.createdAt.toISOString(),
      metadata: e.metadataJson,
    })),
  });
}
