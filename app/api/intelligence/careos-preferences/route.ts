import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import {
  careOSPreferenceKeySchema,
  listCareOSPreferences,
  revokeCareOSPreference,
  upsertCareOSPreference,
  upsertCareOSPreferenceSchema,
} from "@/intelligence/preferences/preference-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { hasPermission } from "@/lib/auth/permissions";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

const revokeSchema = z.object({ key: careOSPreferenceKeySchema });

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, "profile:read:self")) {
    return NextResponse.json({ error: "You cannot read these preferences." }, { status: 403 });
  }

  const config = getMapAbleIntelligenceConfig();
  if (!config.careOSPersistenceEnabled) {
    return NextResponse.json({ preferences: [], persistenceEnabled: false });
  }

  try {
    const preferences = await listCareOSPreferences(user.id);
    return NextResponse.json({ preferences, persistenceEnabled: true });
  } catch (error) {
    console.error("[careos-preferences-list]", error);
    return NextResponse.json(
      { error: "CareOS preferences could not be loaded." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, "profile:write:self")) {
    return NextResponse.json({ error: "You cannot update these preferences." }, { status: 403 });
  }

  const config = getMapAbleIntelligenceConfig();
  if (!config.careOSPersistenceEnabled) {
    return NextResponse.json(
      { error: "CareOS preference storage is disabled." },
      { status: 503 },
    );
  }

  try {
    const input = upsertCareOSPreferenceSchema.parse(await request.json());
    await upsertCareOSPreference({ participantId: user.id, ...input });
    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      participantId: user.id,
      action: "careos.preference.confirmed",
      entityType: "CareOSParticipantPreference",
      entityId: input.key,
      metadata: { preferenceKey: input.key, expiresAt: input.expiresAt ?? null },
    });
    return NextResponse.json({ saved: true, key: input.key });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please check the preference value.", issues: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[careos-preferences-upsert]", error);
    return NextResponse.json({ error: "The preference could not be saved." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, "profile:write:self")) {
    return NextResponse.json({ error: "You cannot revoke these preferences." }, { status: 403 });
  }

  try {
    const input = revokeSchema.parse(await request.json());
    const revoked = await revokeCareOSPreference({ participantId: user.id, key: input.key });
    if (!revoked) {
      return NextResponse.json({ error: "Preference not found." }, { status: 404 });
    }
    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      participantId: user.id,
      action: "careos.preference.revoked",
      entityType: "CareOSParticipantPreference",
      entityId: input.key,
    });
    return NextResponse.json({ revoked: true, key: input.key });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid preference key." }, { status: 400 });
    }
    console.error("[careos-preferences-revoke]", error);
    return NextResponse.json({ error: "The preference could not be revoked." }, { status: 500 });
  }
}
