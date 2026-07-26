import { createHmac, timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

import { deliverN8nEvent } from "@/lib/automation/n8n/n8n-webhook-service";

type N8nWebhookBody = {
  eventKey: string;
  payload?: Record<string, unknown>;
};

/**
 * Verify x-n8n-signature (HMAC-SHA256 of the raw body) with timing-safe compare.
 * Returns true when valid; false when missing/invalid.
 */
function verifySignatureOrReject(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) {
    return false;
  }

  const provided = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice("sha256=".length).trim()
    : signatureHeader.trim();
  if (!provided) return false;

  const expectedHex = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const expectedBuf = Buffer.from(expectedHex, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");

  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }

  return timingSafeEqual(expectedBuf, providedBuf);
}

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-n8n-signature");

  if (!verifySignatureOrReject(raw, signature)) {
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
