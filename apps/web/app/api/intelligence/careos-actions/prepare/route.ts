import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  buildCareOSActionEnvelope,
  careOSPrepareActionSchema,
  hashCareOSPayload,
} from "@/intelligence/actions/action-envelope";
import { createCareOSActionToken } from "@/intelligence/actions/action-token";
import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import { requireApiSession } from "@/lib/api/auth-handler";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { hasPermission } from "@/lib/auth/permissions";

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const config = getMapAbleIntelligenceConfig();
  if (!config.careOSNetworkEnabled || !config.writeActionsEnabled) {
    return NextResponse.json(
      { error: "CareOS confirmed actions are disabled. Standard service forms remain available." },
      { status: 503 },
    );
  }

  try {
    const input = careOSPrepareActionSchema.parse(await request.json());
    const permission =
      input.actionType === "submit_care_request"
        ? "care:manage:self"
        : "transport:manage:self";
    if (!hasPermission(user.primaryRole, permission)) {
      return NextResponse.json({ error: "You cannot prepare this action." }, { status: 403 });
    }

    const envelope = buildCareOSActionEnvelope({
      proposalId: input.proposalId,
      requestId: input.requestId,
      participantId: user.id,
      actionType: input.actionType,
      payload: input.payload,
      informationToShare: input.confirmedInformationToShare,
    });
    const token = createCareOSActionToken(envelope);

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      participantId: user.id,
      action: "careos.action.prepared",
      entityType: "CareOSActionProposal",
      entityId: input.proposalId,
      metadata: {
        requestId: input.requestId,
        actionType: input.actionType,
        proposalPayloadHash: input.proposalPayloadHash,
        executionPayloadHash: hashCareOSPayload(envelope.payload),
        informationFieldCount: envelope.informationToShare.length,
        expiresAt: envelope.expiresAt,
      },
    });

    return NextResponse.json({
      token,
      tokenId: envelope.tokenId,
      proposalId: envelope.proposalId,
      actionType: envelope.actionType,
      payloadHash: envelope.payloadHash,
      expiresAt: envelope.expiresAt,
      confirmationText:
        envelope.actionType === "submit_care_request"
          ? "Confirm to create and submit this care request. Providers and workers are not assigned automatically."
          : "Confirm to create this transport request for provider review. Availability is not guaranteed.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please check the proposed action details.", issues: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[careos-action-prepare]", error);
    return NextResponse.json({ error: "The action could not be prepared." }, { status: 500 });
  }
}
