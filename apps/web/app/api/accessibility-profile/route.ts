import { ZodError } from "zod";

import { requireApiSessionOrMobileBearer } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { accessibilityProfileSchema } from "@/lib/validation/accessibility";

const defaultProfile = {
  mobilityNeeds: [],
  communicationPreferences: [],
  sensoryPreferences: {},
  cognitivePreferences: {},
  transportRequirements: {},
  digitalPreferences: {},
  shareWithProviders: {},
};

export async function GET(req: Request) {
  const user = await requireApiSessionOrMobileBearer(
    req,
    "accessibility:read",
  );
  if (user instanceof Response) return user;

  const profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: user.id },
  });

  if (profile) return jsonOk({ profile });

  // A scoped mobile read must stay read-only. Return the default projection
  // without creating a database row; the first explicit PATCH will upsert it.
  if (req.headers.has("authorization")) {
    return jsonOk({ profile: defaultProfile });
  }

  // Preserve the established web-session behaviour for existing web clients.
  const created = await prisma.accessibilityProfile.create({
    data: { userId: user.id, ...defaultProfile },
  });
  return jsonOk({ profile: created });
}

export async function PATCH(req: Request) {
  const user = await requireApiSessionOrMobileBearer(
    req,
    "accessibility:write",
  );
  if (user instanceof Response) return user;

  try {
    const parsed = accessibilityProfileSchema.parse(await req.json());
    const jsonData = parsed as object;
    const updated = await prisma.accessibilityProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...jsonData },
      update: jsonData,
    });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole as never,
      action: "accessibility.updated",
      entityType: "AccessibilityProfile",
      entityId: updated.id,
      participantId: user.id,
    });

    return jsonOk({ profile: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Update failed", 500);
  }
}
