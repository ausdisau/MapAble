import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

import {
  claimCareOSAction,
  completeCareOSAction,
  failCareOSAction,
} from "@/intelligence/actions/action-receipt-service";
import { hashCareOSPayload } from "@/intelligence/actions/action-envelope";
import { verifyCareOSActionToken } from "@/intelligence/actions/action-token";
import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import { requireApiSession } from "@/lib/api/auth-handler";
import { hasPermission } from "@/lib/auth/permissions";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  createCareRequest,
  submitCareRequest,
} from "@/lib/care/care-request-service";
import { createTransportTrip } from "@/lib/transport/transport-trip-service";
import { createCareRequestSchema } from "@/lib/validation/care";
import { createTransportTripSchema } from "@/lib/validation/transport-trip-schemas";

const requestSchema = z.object({
  token: z.string().min(20),
  confirmed: z.literal(true),
});

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const config = getMapAbleIntelligenceConfig();
  if (!config.careOSNetworkEnabled || !config.writeActionsEnabled) {
    return NextResponse.json(
      { error: "CareOS confirmed actions are disabled." },
      { status: 503 },
    );
  }

  let receiptId: string | null = null;
  try {
    const input = requestSchema.parse(await request.json());
    const envelope = verifyCareOSActionToken(input.token);
    if (envelope.participantId !== user.id) {
      return NextResponse.json(
        { error: "This action approval belongs to another participant." },
        { status: 403 },
      );
    }
    if (hashCareOSPayload(envelope.payload) !== envelope.payloadHash) {
      return NextResponse.json(
        { error: "The approved payload has changed." },
        { status: 400 },
      );
    }

    const permission =
      envelope.actionType === "submit_care_request"
        ? "care:manage:self"
        : "transport:manage:self";
    if (!hasPermission(user.primaryRole, permission)) {
      return NextResponse.json(
        { error: "You cannot execute this action." },
        { status: 403 },
      );
    }

    receiptId = await claimCareOSAction(envelope);

    let entityType: "CareRequest" | "TransportTrip";
    let entityId: string;
    let result: unknown;

    if (envelope.actionType === "submit_care_request") {
      const payload = createCareRequestSchema.parse(envelope.payload);
      const careRequest = await createCareRequest({
        ...payload,
        preferredDate: payload.preferredDate
          ? new Date(payload.preferredDate)
          : undefined,
        participantId: user.id,
        createdById: user.id,
      });
      result = await submitCareRequest(careRequest.id, user.id);
      entityType = "CareRequest";
      entityId = careRequest.id;
    } else {
      const payload = createTransportTripSchema.parse(envelope.payload);
      const transport = await createTransportTrip(user, payload);
      entityType = "TransportTrip";
      entityId = transport.trip.id;
      result = transport;
    }

    await completeCareOSAction({
      receiptId,
      resultEntityType: entityType,
      resultEntityId: entityId,
    });
    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      participantId: user.id,
      action: "careos.action.executed",
      entityType,
      entityId,
      metadata: {
        receiptId,
        requestId: envelope.requestId,
        proposalId: envelope.proposalId,
        actionType: envelope.actionType,
        payloadHash: envelope.payloadHash,
      },
    });

    return NextResponse.json(
      {
        receipt: {
          id: receiptId,
          actionType: envelope.actionType,
          status: "completed",
          resultEntityType: entityType,
          resultEntityId: entityId,
          payloadHash: envelope.payloadHash,
        },
        result,
      },
      { status: 201 },
    );
  } catch (error) {
    const code =
      error instanceof Error ? error.message : "CAREOS_ACTION_FAILED";
    if (receiptId) {
      await failCareOSAction({ receiptId, errorCode: code });
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "The approved action is invalid.", issues: error.flatten() },
        { status: 400 },
      );
    }
    if (code === "CAREOS_ACTION_ALREADY_USED") {
      return NextResponse.json(
        { error: "This action has already been used." },
        { status: 409 },
      );
    }
    if (code === "EXPIRED_CAREOS_ACTION_TOKEN") {
      return NextResponse.json(
        { error: "This action approval has expired." },
        { status: 410 },
      );
    }
    if (code === "INVALID_CAREOS_ACTION_TOKEN") {
      return NextResponse.json(
        { error: "This action approval could not be verified." },
        { status: 400 },
      );
    }
    console.error("[careos-action-execute]", error);
    return NextResponse.json(
      {
        error:
          "The action was not completed. Prepare a new approval before retrying.",
      },
      { status: 500 },
    );
  }
}
