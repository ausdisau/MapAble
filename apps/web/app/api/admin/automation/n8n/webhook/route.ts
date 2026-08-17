import { NextResponse } from "next/server";

import {
  deliverN8nEvent,
  verifyN8nWebhookSignature,
} from "@/lib/automation/n8n/n8n-webhook-service";

type N8nWebhookBody = {
  eventKey: string;
  payload?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-n8n-signature");

  if (!verifyN8nWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: N8nWebhookBody;
  try {
    body = JSON.parse(raw) as N8nWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.eventKey || typeof body.eventKey !== "string") {
    return NextResponse.json({ error: "eventKey is required" }, { status: 400 });
  }

  try {
    const result = await deliverN8nEvent(body.eventKey, body.payload ?? {});
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delivery failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
