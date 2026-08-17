import { z } from "zod";

import {
  correctMemoryItem,
  deleteMemoryItem,
  withdrawMemoryItem,
} from "@/lib/ai/navigator/memory/service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isNavigatorMemoryEnabled } from "@/lib/config/navigator-pilot";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    action: z.enum(["correct", "withdraw"]),
    contentSummary: z.string().min(1).max(500).optional(),
    note: z.string().max(500).optional(),
  })
  .strict();

const deleteSchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
  })
  .strict();

export async function PATCH(req: Request, ctx: Ctx) {
  if (!isNavigatorMemoryEnabled()) {
    return jsonError("NAVIGATOR_MEMORY_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`navigator-memory-patch:${ip}`, {
      windowMs: 60_000,
      max: 30,
    })
  ) {
    return jsonError("RATE_LIMITED", 429);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  try {
    switch (parsed.data.action) {
      case "correct": {
        if (!parsed.data.contentSummary) {
          return jsonError("CONTENT_SUMMARY_REQUIRED", 400);
        }
        const item = await correctMemoryItem({
          id,
          tenantId: parsed.data.tenantId,
          participantId: parsed.data.participantId,
          actorUserId: user.id,
          contentSummary: parsed.data.contentSummary,
          note: parsed.data.note,
        });
        return jsonOk({ item });
      }
      case "withdraw": {
        const item = await withdrawMemoryItem({
          id,
          tenantId: parsed.data.tenantId,
          participantId: parsed.data.participantId,
          actorUserId: user.id,
        });
        return jsonOk({ item });
      }
      default: {
        const _exhaustive: never = parsed.data.action;
        return jsonError(`UNKNOWN_ACTION:${String(_exhaustive)}`, 400);
      }
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "NAVIGATOR_MEMORY_ERROR";
    return jsonError(message, message.includes("NOT_FOUND") ? 404 : 400);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  if (!isNavigatorMemoryEnabled()) {
    return jsonError("NAVIGATOR_MEMORY_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`navigator-memory-delete:${ip}`, {
      windowMs: 60_000,
      max: 20,
    })
  ) {
    return jsonError("RATE_LIMITED", 429);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await ctx.params;

  let body: unknown = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = await parseJsonRequestBody(req);
    } else {
      const url = new URL(req.url);
      body = {
        tenantId: url.searchParams.get("tenantId"),
        participantId: url.searchParams.get("participantId"),
      };
    }
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  try {
    const item = await deleteMemoryItem({
      id,
      tenantId: parsed.data.tenantId,
      participantId: parsed.data.participantId,
      actorUserId: user.id,
    });
    return jsonOk({ item, deleted: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "NAVIGATOR_MEMORY_ERROR";
    return jsonError(message, message.includes("NOT_FOUND") ? 404 : 400);
  }
}
