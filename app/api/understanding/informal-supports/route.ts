import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isUnderstandingEnabled } from "@/lib/config/understanding";
import {
  deleteInformalSupport,
  listInformalSupports,
  upsertInformalSupport,
} from "@/lib/understanding/informal-support-service";

const upsertSchema = z.object({
  id: z.string().cuid().optional(),
  supporterDisplayName: z.string().min(1).max(200),
  supporterUserId: z.string().cuid().optional().nullable(),
  relationshipLabel: z.string().min(1).max(120),
  capacityScore: z.number().int().min(0).max(100),
  stabilityTrend: z.enum(["stable", "declining", "improving", "unknown"]),
  notes: z.string().max(2000).optional().nullable(),
});

const deleteSchema = z.object({
  id: z.string().cuid(),
  delete: z.literal(true),
});

export async function GET() {
  if (!isUnderstandingEnabled()) {
    return jsonError("Understanding layer is not enabled", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const supports = await listInformalSupports(user.id);
  return jsonOk({ supports });
}

export async function POST(req: Request) {
  if (!isUnderstandingEnabled()) {
    return jsonError("Understanding layer is not enabled", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const participantId = user.id;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const del = deleteSchema.safeParse(body);
  if (del.success) {
    try {
      await deleteInformalSupport({ id: del.data.id, participantId });
      return jsonOk({ ok: true });
    } catch (e) {
      if (e instanceof Error && e.message === "NOT_FOUND") {
        return jsonError("Informal support not found", 404);
      }
      throw e;
    }
  }

  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const support = await upsertInformalSupport({
    participantId,
    ...parsed.data,
  });
  return jsonOk({ support });
}
