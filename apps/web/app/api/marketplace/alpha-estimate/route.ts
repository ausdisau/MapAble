import { z } from "zod";

import { jsonError, zodErrorResponse } from "@/lib/api/response";
import { getApiUser } from "@/lib/auth/guards";
import {
  alphaGateFromEnvironment,
  canAccessMarketplaceAlpha,
} from "@/lib/marketplace/alpha-access";
import { previewMarketEstimate } from "@/packages/marketplace-inclusive/src/index";

export const runtime = "nodejs";

const requestSchema = z
  .object({
    lines: z
      .array(
        z
          .object({
            id: z.string().regex(/^demo-[a-z-]+$/),
            quantity: z.number().int().min(1).max(5),
          })
          .strict(),
      )
      .min(1)
      .max(8),
  })
  .strict();

/**
 * Authenticated, allowlisted synthetic quote preview ONLY.
 * Client prices, personal identifiers, NDIS and GST decisions are not accepted.
 */
export async function POST(req: Request): Promise<Response> {
  const gate = alphaGateFromEnvironment();
  if (!gate.enabled) return jsonError("Not found", 404);
  const user = await getApiUser();
  if (!canAccessMarketplaceAlpha(user, gate)) {
    return jsonError("Not found", 404);
  }

  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin)
    return jsonError("Cross-origin requests are not permitted", 403);
  if (!(req.headers.get("content-type") ?? "").includes("application/json"))
    return jsonError("Expected JSON request", 415);
  const length = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 8192)
    return jsonError("Request too large", 413);

  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > 8192) return jsonError("Request too large", 413);
    body = JSON.parse(raw);
  } catch {
    return jsonError("Malformed JSON", 400);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const preview = previewMarketEstimate(parsed.data.lines);
    return Response.json(
      { preview, simulationOnly: true },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Invalid synthetic selection",
      422,
    );
  }
}
