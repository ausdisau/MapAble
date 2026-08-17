import { ParticipantProviderRelationshipStatus } from "@prisma/client";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import {
  isResponse,
  jsonError,
  jsonOk,
  zodErrorResponse,
} from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { assertOrgAccess } from "@/lib/ndis/claiming/claim-service";
import {
  assertCanManageParticipantProviderRelationship,
  listParticipantProviderRelationships,
  ParticipantProviderAccessError,
  upsertParticipantProviderRelationship,
} from "@/lib/ndis/participant-provider-relationship-service";
import { createParticipantProviderRelationshipSchema } from "@/lib/ndis/schemas";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;

  const url = new URL(req.url);
  const providerOrgId = url.searchParams.get("providerOrgId") ?? undefined;
  const participantId = url.searchParams.get("participantId") ?? undefined;
  const statusParam = url.searchParams.get("status");
  const status = statusParam
    ? (statusParam as ParticipantProviderRelationshipStatus)
    : undefined;

  if (!providerOrgId && !participantId) {
    return jsonError("providerOrgId or participantId is required", 400);
  }

  try {
    if (providerOrgId) {
      if (!isAdminRole(user.primaryRole)) {
        await assertOrgAccess(user, providerOrgId);
      }
    } else if (participantId) {
      if (!isAdminRole(user.primaryRole) && user.id !== participantId) {
        return jsonError("Forbidden", 403);
      }
    }

    const relationships = await listParticipantProviderRelationships({
      providerOrgId,
      participantId,
      status,
    });
    return jsonOk({ relationships });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError(msg, 400);
  }
}

export async function POST(req: Request) {
  const user = await requireApiPermission("provider:ndis:claim");
  if (isResponse(user)) return user;

  const parsed = createParticipantProviderRelationshipSchema.safeParse(
    await req.json()
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await assertCanManageParticipantProviderRelationship(
      user,
      parsed.data.participantId,
      parsed.data.providerOrgId
    );

    const relationship = await upsertParticipantProviderRelationship({
      participantId: parsed.data.participantId,
      providerOrgId: parsed.data.providerOrgId,
      status: parsed.data.status ?? "pending_verification",
      notes: parsed.data.notes,
      actorUserId: user.id,
    });

    return jsonOk({ relationship }, 201);
  } catch (e) {
    if (e instanceof ParticipantProviderAccessError) {
      return jsonError(e.message, 403);
    }
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError(msg, 400);
  }
}
