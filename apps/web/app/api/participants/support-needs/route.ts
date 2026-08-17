import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { apiForbidden } from "@/lib/auth/guards";
import {
  mapLiteAssessorToICanPayload,
  REGISTRATION_ASSESSOR_SKIPPED_STATUS,
  REGISTRATION_ASSESSOR_STATUS,
  SupportNeedsAssessorBodySchema,
} from "@/lib/intake/support-needs-assessor";
import { refreshParticipantOnboarding } from "@/lib/onboarding/onboarding-service";
import { prisma } from "@/lib/prisma";
import { ICAN_V6_DOMAIN_IDS } from "@/lib/validation/i-can-v6";

function isParticipantUser(user: {
  primaryRole: string;
  roles: string[];
}): boolean {
  return (
    user.primaryRole === "participant" || user.roles.includes("participant")
  );
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!isParticipantUser(user)) {
    return apiForbidden();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  let parsed;
  try {
    parsed = SupportNeedsAssessorBodySchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    return jsonError("Invalid request body", 400);
  }

  if ("skipped" in parsed && parsed.skipped === true) {
    // Record skip for audit only — does not count as a completed snapshot.
    const submission = await prisma.iCanV6IntakeSubmission.create({
      data: {
        participantId: user.id,
        status: REGISTRATION_ASSESSOR_SKIPPED_STATUS,
        payload: {
          skipped: true,
          source: "registration_assessor",
        } as Prisma.InputJsonValue,
      },
    });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      action: "support_needs.assessor_skipped",
      entityType: "ICanV6IntakeSubmission",
      entityId: submission.id,
      participantId: user.id,
      metadata: { status: REGISTRATION_ASSESSOR_SKIPPED_STATUS },
    });

    await refreshParticipantOnboarding(user.id, user.id);

    return jsonOk(
      {
        id: submission.id,
        status: REGISTRATION_ASSESSOR_SKIPPED_STATUS,
        skipped: true as const,
        notice:
          "You can complete your support needs snapshot later from onboarding.",
      },
      202,
    );
  }

  try {
    const icanPayload = mapLiteAssessorToICanPayload(parsed);

    const submission = await prisma.iCanV6IntakeSubmission.create({
      data: {
        participantId: user.id,
        status: REGISTRATION_ASSESSOR_STATUS,
        payload: {
          ...icanPayload,
          source: "registration_assessor",
          selectedAreas: parsed.selectedAreas,
          priorityArea: parsed.priorityArea ?? null,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      action: "support_needs.assessor_submitted",
      entityType: "ICanV6IntakeSubmission",
      entityId: submission.id,
      participantId: user.id,
      metadata: {
        status: REGISTRATION_ASSESSOR_STATUS,
        selectedAreaCount: parsed.selectedAreas.length,
        priorityArea: parsed.priorityArea ?? null,
        domainCount: ICAN_V6_DOMAIN_IDS.length,
      },
    });

    await refreshParticipantOnboarding(user.id, user.id);

    return jsonOk(
      {
        id: submission.id,
        status: REGISTRATION_ASSESSOR_STATUS,
        skipped: false as const,
        notice:
          "Saved as a planning snapshot. Not submitted to NDIA. You can update this later.",
      },
      202,
    );
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    console.error("[participants/support-needs] failed", err);
    return jsonError("Unable to store support needs snapshot", 500);
  }
}

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!isParticipantUser(user)) {
    return apiForbidden();
  }

  const latest = await prisma.iCanV6IntakeSubmission.findFirst({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, createdAt: true },
  });

  return jsonOk({
    hasSubmission: Boolean(latest),
    latest: latest
      ? {
          id: latest.id,
          status: latest.status,
          createdAt: latest.createdAt.toISOString(),
        }
      : null,
  });
}
