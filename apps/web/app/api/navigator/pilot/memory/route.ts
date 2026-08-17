import { z } from "zod";

import {
  listMemoryItems,
  navigatorMemoryCategorySchema,
  upsertMemoryItem,
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

const listQuerySchema = z.object({
  tenantId: z.string().min(1),
  participantId: z.string().min(1),
  category: navigatorMemoryCategorySchema.optional(),
  includeWithdrawn: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

const createSchema = z
  .object({
    id: z.string().min(1).optional(),
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    purpose: z.string().min(1).max(200),
    category: navigatorMemoryCategorySchema,
    contentSummary: z.string().min(1).max(500),
    provenance: z.string().min(1).max(200),
    consentRecordId: z.string().min(1).nullable().optional(),
    confidence: z.string().max(80).optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  })
  .strict();

export async function GET(req: Request) {
  if (!isNavigatorMemoryEnabled()) {
    return jsonError("NAVIGATOR_MEMORY_DISABLED", 403);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const parsed = listQuerySchema.safeParse({
    tenantId: url.searchParams.get("tenantId"),
    participantId: url.searchParams.get("participantId"),
    category: url.searchParams.get("category") ?? undefined,
    includeWithdrawn: url.searchParams.get("includeWithdrawn") ?? undefined,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  try {
    const items = await listMemoryItems({
      tenantId: parsed.data.tenantId,
      participantId: parsed.data.participantId,
      category: parsed.data.category,
      includeWithdrawn: parsed.data.includeWithdrawn,
    });
    return jsonOk({ items });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "NAVIGATOR_MEMORY_ERROR";
    return jsonError(message, 400);
  }
}

export async function POST(req: Request) {
  if (!isNavigatorMemoryEnabled()) {
    return jsonError("NAVIGATOR_MEMORY_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`navigator-memory-upsert:${ip}`, {
      windowMs: 60_000,
      max: 30,
    })
  ) {
    return jsonError("RATE_LIMITED", 429);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (user.id !== parsed.data.participantId) {
    return jsonError("FORBIDDEN", 403);
  }

  try {
    const item = await upsertMemoryItem({
      ...parsed.data,
      creatingActorId: user.id,
      expiresAt: parsed.data.expiresAt
        ? new Date(parsed.data.expiresAt)
        : parsed.data.expiresAt,
    });
    return jsonOk({ item });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "NAVIGATOR_MEMORY_ERROR";
    return jsonError(message, message.includes("FORBIDDEN") ? 400 : 400);
  }
}
