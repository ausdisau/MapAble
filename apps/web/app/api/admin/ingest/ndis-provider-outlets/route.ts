import { z } from "zod";

import { checkIpRateLimit } from "@/lib/api/ip-rate-limit";
import { getApiUser } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { previewNdisDirectory } from "@/lib/ingestion/ndis-outlet-import-service";

export const maxDuration = 300;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PreviewRequest = z.object({
  mode: z.literal("preview"),
  source: z.enum(["bundled", "official"]),
}).strict();

function reply(data: Record<string, unknown>, status: number): Response {
  return Response.json(data, {
    status, headers: { "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff" },
  });
}
async function readSmallBody(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const bytes: Uint8Array[] = [];
  let count = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      count += value.byteLength;
      if (count > 2048) throw new Error("REQUEST_BODY_TOO_LARGE");
      bytes.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(bytes.map((b) => Buffer.from(b))).toString("utf8");
}
/**
 * Admin PREVIEW ONLY. There is intentionally no route or action for
 * uploaded JSON, arbitrary URLs, staging, publishing or database writes.
 * Real import is an operator-controlled CLI job.
 */
export async function POST(request: Request): Promise<Response> {
  const current = await getApiUser();
  if (!current || !isAdminRole(current.primaryRole)) {
    return reply({ ok: false, error: "Not authorised" }, 403);
  }
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin ||
      request.headers.get("x-mapable-admin-intent") !== "ndis-outlet-preview") {
    return reply({ ok: false, error: "Same-origin admin intent required" }, 403);
  }
  if (!checkIpRateLimit("ndia-outlet-preview:" + current.id,
    { windowMs: 60_000, max: 3 })) {
    return reply({ ok: false, error: "Too many previews" }, 429);
  }

  let parsed: ReturnType<typeof PreviewRequest.safeParse>;
  try {
    parsed = PreviewRequest.safeParse(JSON.parse(await readSmallBody(request)) as unknown);
  } catch {
    return reply({ ok: false, error: "Invalid request" }, 400);
  }
  if (!parsed.success) {
    return reply({ ok: false, error: "Preview only; source must be bundled or official" }, 400);
  }
  try {
    const preview = await previewNdisDirectory({ kind: parsed.data.source });
    return reply({ ok: true, preview }, 200);
  } catch (error) {
    const code = error instanceof Error && /^NDIA_[A-Z_]+$/.test(error.message)
      ? error.message : "NDIA_PREVIEW_UNAVAILABLE";
    return reply({ ok: false, error: code }, 503);
  }
}
