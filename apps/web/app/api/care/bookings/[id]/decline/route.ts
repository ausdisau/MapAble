import { ZodError, z } from "zod";

import { emitCareOSDomainEventBestEffort } from "@/intelligence/continuity/domain-event-service";
import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { providerDeclineCareBooking } from "@/lib/care/care-booking-service";

const bodySchema = z.object({ reason: z.string().max(1000).optional() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const body = bodySchema.parse(await req.json().catch(() => ({})));
    const booking = await providerDeclineCareBooking(id, user, body.reason);
    void emitCareOSDomainEventBestEffort({
      participantId: booking.participantId,
      eventType: "provider_declined",
      sourceModule: "care",
      sourceEntityId: booking.id,
      summary: "A care provider declined a request linked to the participant.",
      actorUserId: user.id,
      metadata: { reasonProvided: Boolean(body.reason) },
    });
    return jsonOk({ booking });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    return jsonError("Forbidden", 403);
  }
}
