import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isAdminRole } from "@/lib/auth/roles";
import { encryptNdisNumber, maskNdisNumber } from "@/lib/crypto/ndis";
import { prisma } from "@/lib/prisma";
import {
  adminParticipantUpdateSchema,
  participantProfileSchema,
} from "@/lib/validation/participant";

function serializeProfile(
  profile: {
    ndisParticipantNumberEnc: string | null;
    [key: string]: unknown;
  },
  isAdmin: boolean
) {
  const { ndisParticipantNumberEnc, adminNotes, ...rest } = profile;
  return {
    ...rest,
    ndisParticipantNumberMasked: ndisParticipantNumberEnc
      ? maskNdisNumber("0000000000")
      : null,
    ...(isAdmin
      ? {
          adminNotes,
          hasNdisNumber: Boolean(ndisParticipantNumberEnc),
        }
      : {}),
  };
}

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let profile = await prisma.participantProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    profile = await prisma.participantProfile.create({
      data: {
        userId: user.id,
        displayName: user.name,
      },
    });
  }

  return jsonOk({
    profile: serializeProfile(profile, isAdminRole(user.primaryRole)),
  });
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const raw = await req.json();
    const isAdmin = isAdminRole(user.primaryRole);
    const parsed = isAdmin
      ? adminParticipantUpdateSchema.parse(raw)
      : participantProfileSchema.parse(raw);

    const { ndisParticipantNumber, dateOfBirth, adminNotes, ...data } =
      parsed as typeof parsed & {
        ndisParticipantNumber?: string | null;
        dateOfBirth?: string | null;
        adminNotes?: string | null;
      };

    const profilePayload = {
      displayName: data.displayName ?? user.name,
      preferredName: data.preferredName,
      primaryContactMethod: data.primaryContactMethod,
      emergencyContact: data.emergencyContact ?? undefined,
      supportCoordinatorContact: data.supportCoordinatorContact ?? undefined,
      planManagerContact: data.planManagerContact ?? undefined,
      homeSuburb: data.homeSuburb,
      homeState: data.homeState,
      timezone: data.timezone,
      participantNotes: data.participantNotes,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      ...(ndisParticipantNumber
        ? { ndisParticipantNumberEnc: encryptNdisNumber(ndisParticipantNumber) }
        : {}),
      ...(isAdmin && adminNotes !== undefined ? { adminNotes } : {}),
    };

    const updated = await prisma.participantProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...profilePayload },
      update: {
        ...profilePayload,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      },
    });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole as never,
      action: "profile.updated",
      entityType: "ParticipantProfile",
      entityId: updated.id,
      participantId: user.id,
    });

    return jsonOk({
      profile: serializeProfile(updated, isAdmin),
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Update failed", 500);
  }
}
