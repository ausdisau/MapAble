import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
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

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    profile = await prisma.accessibilityProfile.create({
      data: { userId: user.id, ...defaultProfile },
    });
  }

  return jsonOk({ profile });
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
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
