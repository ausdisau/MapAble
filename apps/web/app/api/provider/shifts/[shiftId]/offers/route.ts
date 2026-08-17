import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createShiftOffer } from "@/lib/care/shift-offer-service";

const schema = z.object({
  workerProfileId: z.string().min(1),
  idempotencyKey: z.string().uuid(),
  requiredCredentialTypes: z.array(z.string()).default([]),
  expiresAt: z.string().datetime(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shiftId: string }> },
) {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const { shiftId } = await params;
    return jsonOk(
      {
        offer: await createShiftOffer({
          actor,
          careShiftId: shiftId,
          workerProfileId: parsed.data.workerProfileId,
          idempotencyKey: parsed.data.idempotencyKey,
          requiredCredentialTypes: parsed.data.requiredCredentialTypes,
          expiresAt: new Date(parsed.data.expiresAt),
        }),
      },
      201,
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "SHIFT_OFFER_FAILED",
      400,
    );
  }
}
