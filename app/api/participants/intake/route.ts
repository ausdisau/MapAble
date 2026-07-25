import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isICanIntakeEnabled } from "@/lib/config/i-can-intake";
import { prisma } from "@/lib/prisma";
import {
  ICAN_V6_DOMAIN_IDS,
  ICanV6IntakeSchema,
  type ICanV6DomainId,
} from "@/lib/validation/i-can-v6";

function sanitizeIntakePayload(
  payload: ReturnType<typeof ICanV6IntakeSchema.parse>,
) {
  const domains = { ...payload.domains };
  for (const id of ICAN_V6_DOMAIN_IDS) {
    const entry = domains[id as ICanV6DomainId];
    domains[id as ICanV6DomainId] = {
      ...entry,
      notes: entry.notes.slice(0, 2000),
    };
  }
  return {
    ...payload,
    domains,
  };
}

export async function POST(req: Request) {
  if (!isICanIntakeEnabled()) {
    return jsonError(
      "I-CAN v6 intake is not enabled. Set MAPABLE_ICAN_INTAKE_ENABLED=true for pilot use.",
      503,
    );
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  try {
    const parsed = ICanV6IntakeSchema.parse(body);
    const sanitized = sanitizeIntakePayload(parsed);

    const submission = await prisma.iCanV6IntakeSubmission.create({
      data: {
        participantId: user.id,
        status: "submitted_draft",
        payload: sanitized as unknown as Prisma.InputJsonValue,
      },
    });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      action: "ican_v6.intake_submitted",
      entityType: "ICanV6IntakeSubmission",
      entityId: submission.id,
      participantId: user.id,
      metadata: {
        status: "submitted_draft",
        domainCount: ICAN_V6_DOMAIN_IDS.length,
        completedDomainCount: ICAN_V6_DOMAIN_IDS.filter(
          (id) => sanitized.domains[id].completed,
        ).length,
        hasClientSessionId: Boolean(sanitized.clientSessionId),
      },
    });

    return jsonOk(
      {
        id: submission.id,
        status: "submitted_draft" as const,
        notice:
          "Stored for planning prep. Not submitted to NDIA.",
      },
      202,
    );
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    console.error("[participants/intake] failed", err);
    return jsonError("Unable to store intake submission", 500);
  }
}
