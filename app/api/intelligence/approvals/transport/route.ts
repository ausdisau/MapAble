import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { verifyApprovalToken } from "@/intelligence/policies/approval-token";
import { requireApiPermission } from "@/lib/api/auth-handler";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { createTransportTrip } from "@/lib/transport/transport-trip-service";
import { createTransportTripSchema } from "@/lib/validation/transport-trip-schemas";

const requestSchema = z.object({
  token: z.string().min(20),
  confirmed: z.literal(true),
});

export async function POST(request: Request) {
  const user = await requireApiPermission("transport:manage:self");
  if (user instanceof Response) return user;

  try {
    const input = requestSchema.parse(await request.json());
    const approval = verifyApprovalToken(input.token);

    if (approval.userId !== user.id) {
      return NextResponse.json({ error: "This approval belongs to another user." }, { status: 403 });
    }

    const tripInput = createTransportTripSchema.parse(approval.trip);
    const result = await createTransportTrip(user, tripInput);

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      action: "intelligence.transport_approved",
      entityType: "TransportTrip",
      entityId: result.trip?.id ?? null,
      participantId: user.id,
      metadata: {
        requestId: approval.requestId,
        optionId: approval.optionId,
        source: "mapable-intelligence-fabric",
      },
    });

    return NextResponse.json({
      trip: result.trip,
      message: "Your transport request has been created for provider review.",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "The approval request is invalid." }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (message === "EXPIRED_APPROVAL_TOKEN") {
      return NextResponse.json({ error: "This approval has expired. Please prepare the journey again." }, { status: 410 });
    }
    if (message === "INVALID_APPROVAL_TOKEN") {
      return NextResponse.json({ error: "This approval could not be verified." }, { status: 400 });
    }

    console.error("[intelligence-transport-approval]", error);
    return NextResponse.json({ error: "The transport request could not be created." }, { status: 500 });
  }
}
