import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isParticipantAccessHistoryEnabled,
  isTrustFabricEnabled,
} from "@/lib/config/trust-fabric";
import {
  challengeAccessReceipt,
  TrustFabricError,
} from "@/lib/trust-fabric/receipt-service";

const challengeSchema = z
  .object({
    receiptId: z.string().min(1),
    note: z.string().max(1000).optional(),
  })
  .strict();

export async function POST(req: Request) {
  if (!isTrustFabricEnabled() || !isParticipantAccessHistoryEnabled()) {
    return jsonError("Participant access history is not enabled", 503);
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
    const parsed = challengeSchema.parse(body);
    const result = await challengeAccessReceipt({
      receiptId: parsed.receiptId,
      participantId: user.id,
      note: parsed.note,
    });
    return jsonOk({
      ...result,
      revokePath: result.consentRevokeSuggested
        ? "/dashboard/consent"
        : "/dashboard/access-history",
      message:
        "Challenge recorded. To stop future use, revoke the related consent in Consent centre when available.",
    });
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    if (err instanceof TrustFabricError) {
      return jsonError(err.message, err.status);
    }
    throw err;
  }
}
