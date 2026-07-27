import { z } from "zod";

import { recordParticipantInvoiceDecision } from "@/lib/abilitypay/abilitypay-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

const schema = z.object({
  decision: z.enum([
    "approve_for_processing",
    "request_clarification",
    "dispute",
    "delegate_review",
    "save_for_later",
  ]),
  reason: z.string().max(2000).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const { invoiceId } = await params;
    return jsonOk({
      receipt: await recordParticipantInvoiceDecision({
        invoiceId,
        actor,
        ...parsed.data,
      }),
    });
  } catch {
    return jsonError("Financial authority denied", 403);
  }
}
