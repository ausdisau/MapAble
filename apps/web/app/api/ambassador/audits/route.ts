import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

const auditSchema = z
  .object({
    placeName: z.string().min(1).max(200),
    placeSlugOrId: z.string().min(1).max(200).optional(),
    entranceStepFree: z.boolean(),
    accessibleToilet: z.boolean(),
    notes: z.string().max(2000).optional().default(""),
  })
  .strict();

/**
 * Year-One Ambassador shell — records an audit event; does not publish places.
 */
export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!hasPermission(user.primaryRole, "ambassador:audit")) {
    return jsonError("Ambassador audit permission required", 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  try {
    const parsed = auditSchema.parse(body);
    await prisma.auditEvent.create({
      data: {
        actorUserId: user.id,
        actorRole: user.primaryRole,
        action: "ambassador.venue_audit_submitted",
        entityType: "access_place_audit",
        entityId: parsed.placeSlugOrId ?? null,
        metadata: {
          placeName: parsed.placeName,
          entranceStepFree: parsed.entranceStepFree,
          accessibleToilet: parsed.accessibleToilet,
          notes: parsed.notes,
          status: "pending_review",
        },
      },
    });
    return jsonOk({
      accepted: true,
      status: "pending_review",
      notice:
        "Ambassador audits are queued for human review. They do not auto-publish venue accessibility.",
    });
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    throw err;
  }
}
