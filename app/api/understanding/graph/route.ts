import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isUnderstandingEnabled } from "@/lib/config/understanding";
import {
  buildParticipantKnowledgeGraph,
  ensureUnderstandingContext,
  linkGraphEntities,
} from "@/lib/understanding/knowledge-graph-service";

const entityTypeSchema = z.enum([
  "goal",
  "routine",
  "event",
  "context",
  "person",
  "place",
  "worker",
  "informal_support",
]);

const mutateSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("ensure_context"),
    key: z.string().min(1).max(64),
    label: z.string().min(1).max(200),
    notes: z.string().max(2000).optional().nullable(),
  }),
  z.object({
    op: z.literal("link"),
    sourceType: entityTypeSchema,
    sourceId: z.string().min(1).max(128),
    targetType: entityTypeSchema,
    targetId: z.string().min(1).max(128),
    relationship: z.string().min(1).max(128),
    metadataJson: z.record(z.string(), z.unknown()).optional(),
  }),
]);

export async function GET() {
  if (!isUnderstandingEnabled()) {
    return jsonError("Understanding layer is not enabled", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const graph = await buildParticipantKnowledgeGraph(user.id);
  return jsonOk(graph);
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

  const parsed = mutateSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (parsed.data.op === "ensure_context") {
    const ctx = await ensureUnderstandingContext({
      participantId,
      key: parsed.data.key,
      label: parsed.data.label,
      notes: parsed.data.notes,
    });
    return jsonOk({ context: ctx });
  }

  const edge = await linkGraphEntities({
    participantId,
    sourceType: parsed.data.sourceType,
    sourceId: parsed.data.sourceId,
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
    relationship: parsed.data.relationship,
    metadataJson: parsed.data.metadataJson,
  });
  return jsonOk({ edge });
}
