import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  inviteDelegate,
  listDelegateInvitations,
  respondToDelegateInvitation,
  revokeDelegateInvitation,
} from "@/lib/delegation/delegate-invitation-service";
import { prisma } from "@/lib/prisma";

const inviteSchema = z.object({
  inviteeEmail: z.string().email(),
  roleType: z.enum([
    "nominee",
    "support_coordinator",
    "plan_manager",
    "family_member",
    "other",
  ]),
  proposedDomain: z.string().min(1),
  proposedActions: z.array(z.string().min(1)).min(1),
  proposedConsentScopes: z.array(z.string()).default([]),
  expiresAt: z.string().datetime(),
  message: z.string().max(1000).optional(),
});

const respondSchema = z.object({
  invitationId: z.string().min(1),
  response: z.enum(["accepted", "declined"]),
});

const revokeSchema = z.object({
  invitationId: z.string().min(1),
});

export async function GET() {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  const [sent, received] = await Promise.all([
    listDelegateInvitations(actor.id),
    prisma.delegateInvitation.findMany({
      where: {
        OR: [
          { inviteeUserId: actor.id },
          { inviteeEmail: actor.email.toLowerCase() },
        ],
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return jsonOk({ sent, received });
}

export async function POST(request: Request) {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  const parsed = inviteSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const invitation = await inviteDelegate({
      participantId: actor.id,
      actorUserId: actor.id,
      inviteeEmail: parsed.data.inviteeEmail,
      roleType: parsed.data.roleType,
      proposedDomain: parsed.data.proposedDomain,
      proposedActions: parsed.data.proposedActions,
      proposedConsentScopes: parsed.data.proposedConsentScopes,
      expiresAt: new Date(parsed.data.expiresAt),
      message: parsed.data.message,
    });
    return jsonOk({ invitation }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invite failed";
    if (message === "DELEGATE_INVITES_DISABLED") {
      return jsonError("Delegate invitations are not enabled", 404);
    }
    if (message === "FINANCIAL_AUTHORITY_REQUIRES_EXPLICIT_GRANT") {
      return jsonError("Financial domains cannot be invited via delegate flow", 403);
    }
    if (message === "CLINICAL_AUTHORITY_REQUIRES_EXPLICIT_GRANT") {
      return jsonError("Clinical domains cannot be invited via delegate flow", 403);
    }
    if (message === "DELEGATE_ACTION_NOT_PERMITTED") {
      return jsonError("One or more proposed actions are not permitted", 403);
    }
    if (message === "PARTICIPANT_AUTHORITY_REQUIRED") {
      return jsonError("Only the participant can send invitations", 403);
    }
    if (message === "INVITATION_EXPIRY_REQUIRED") {
      return jsonError("Expiry must be in the future", 400);
    }
    return jsonError(message, 400);
  }
}

export async function PATCH(request: Request) {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  const parsed = respondSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await respondToDelegateInvitation({
      invitationId: parsed.data.invitationId,
      inviteeUserId: actor.id,
      inviteeEmail: actor.email,
      response: parsed.data.response,
    });
    return jsonOk(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Respond failed";
    if (message === "DELEGATE_INVITATION_NOT_FOUND") {
      return jsonError("Invitation not found", 404);
    }
    if (message === "DELEGATE_INVITATION_EXPIRED") {
      return jsonError("Invitation has expired", 410);
    }
    return jsonError(message, 400);
  }
}

export async function DELETE(request: Request) {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  const parsed = revokeSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await revokeDelegateInvitation({
      invitationId: parsed.data.invitationId,
      participantId: actor.id,
      actorUserId: actor.id,
    });
    return jsonOk({ revoked: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Revoke failed";
    if (message === "DELEGATE_INVITATION_NOT_FOUND") {
      return jsonError("Invitation not found", 404);
    }
    if (message === "PARTICIPANT_AUTHORITY_REQUIRED") {
      return jsonError("Only the participant can revoke invitations", 403);
    }
    return jsonError(message, 400);
  }
}
