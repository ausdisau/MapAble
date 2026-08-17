import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { apiForbidden } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { isPaceQuarterlyPacingEnabled } from "@/lib/config/strategic-2026";
import { evaluateQuarterlyBudgetPacing } from "@/lib/ndis/pace-period-tracker";
import { verifyPaceEndorsement } from "@/lib/ndis/pace-service";
import { notifyUser } from "@/lib/notifications/notification-service";

const BodySchema = z.object({
  participantId: z.string().min(1),
  providerId: z.string().min(1),
  categoryCode: z.string().min(1).default("0001"),
});

export async function POST(req: Request) {
  if (!isPaceQuarterlyPacingEnabled()) {
    return jsonError("PACE quarterly pacing is disabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const allowed =
    hasPermission(user.primaryRole, "care:shift:work") ||
    hasPermission(user.primaryRole, "provider:booking:respond") ||
    hasPermission(user.primaryRole, "booking:create") ||
    hasPermission(user.primaryRole, "provider:ndis:claim");
  if (!allowed) return apiForbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { participantId, providerId, categoryCode } = parsed.data;

  try {
    const endorsement = await verifyPaceEndorsement(
      participantId,
      providerId,
      categoryCode
    );
    const pacing = evaluateQuarterlyBudgetPacing(participantId, categoryCode);

    let consentRequestQueued = false;
    if (!endorsement.authorized) {
      const notification = await notifyUser(
        participantId,
        "consent",
        "PACE My Providers endorsement requested",
        JSON.stringify({
          type: "pace_my_providers_endorsement",
          providerId,
          categoryCode,
          requestedBy: user.id,
        })
      );
      consentRequestQueued = Boolean(notification);
    }

    await createAuditEvent({
      actorUserId: user.id,
      action: "care.booking.pace_check",
      entityType: "ParticipantProviderRelationship",
      participantId,
      organisationId: providerId,
      metadata: {
        endorsed: endorsement.authorized,
        paceStatus: endorsement.status,
        bookingAllowed: pacing.bookingAllowed,
        consentRequestQueued,
        quarterLabel: pacing.quarterLabel,
        remainingAUD: pacing.remainingAUD,
      },
    });

    return jsonOk({
      endorsed: endorsement.authorized,
      endorsement,
      pacing,
      consentRequestQueued,
      notice:
        "Scaffold pace-check only. Endorsement is never auto-approved; participant consent required.",
    });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "PACE check failed",
      400
    );
  }
}
