import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import {
  mergeUiIntoDigitalPreferences,
  parseAccessibilityUiPreferences,
} from "@/lib/accessibility/ui-preferences";
import { requireApiSessionOrMobileBearer } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { digitalPreferencesPatchSchema } from "@/lib/validation/accessibility";
import type { LegacyDigitalPreferences } from "@/types/accessibility-ui";

function asDigitalPreferences(value: unknown): LegacyDigitalPreferences {
  if (!value || typeof value !== "object") return {};
  return value as LegacyDigitalPreferences;
}

function toJsonValue(
  value: LegacyDigitalPreferences,
): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

export async function GET(req: Request) {
  const user = await requireApiSessionOrMobileBearer(
    req,
    "accessibility:read",
  );
  if (user instanceof Response) return user;

  const profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: user.id },
    select: { digitalPreferences: true },
  });

  return jsonOk({
    digitalPreferences: asDigitalPreferences(profile?.digitalPreferences),
  });
}

export async function PATCH(req: Request) {
  const user = await requireApiSessionOrMobileBearer(
    req,
    "accessibility:write",
  );
  if (user instanceof Response) return user;

  try {
    const body = digitalPreferencesPatchSchema.parse(await req.json());
    const existing = await prisma.accessibilityProfile.findUnique({
      where: { userId: user.id },
    });

    const currentDigital = asDigitalPreferences(existing?.digitalPreferences);
    let nextDigital: LegacyDigitalPreferences = { ...currentDigital };

    if (body.ui) {
      const parsedUi = parseAccessibilityUiPreferences(body.ui);
      if (!parsedUi) {
        return jsonError("Invalid display settings", 400);
      }
      nextDigital = mergeUiIntoDigitalPreferences(currentDigital, parsedUi);
    }

    const legacyKeys = [
      "largeText",
      "highContrast",
      "reducedMotion",
      "screenReaderUser",
      "voiceControlPreferred",
      "dyslexiaFriendlyMode",
      "simpleLanguageMode",
    ] as const;
    for (const key of legacyKeys) {
      if (typeof body[key] === "boolean") {
        nextDigital[key] = body[key];
      }
    }

    const digitalJson = toJsonValue(nextDigital);
    const updated = existing
      ? await prisma.accessibilityProfile.update({
          where: { userId: user.id },
          data: { digitalPreferences: digitalJson },
        })
      : await prisma.accessibilityProfile.create({
          data: {
            userId: user.id,
            mobilityNeeds: [],
            communicationPreferences: [],
            sensoryPreferences: {},
            cognitivePreferences: {},
            transportRequirements: {},
            digitalPreferences: digitalJson,
            shareWithProviders: {},
          },
        });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole as never,
      action: "accessibility.updated",
      entityType: "AccessibilityProfile",
      entityId: updated.id,
      participantId: user.id,
    });

    return jsonOk({
      digitalPreferences: asDigitalPreferences(updated.digitalPreferences),
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Update failed", 500);
  }
}
