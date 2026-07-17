import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { createDraftFromServiceRecords } from "@/lib/billing/invoicing/draft";
import { createDraftFromRecordsSchema } from "@/lib/billing/schemas";

export async function POST(req: Request) {
  const user = await requireBillingPermission("billing:create_draft");
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => ({}));
  const parsed = createDraftFromRecordsSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await createDraftFromServiceRecords({
      participantId: parsed.data.participantId,
      serviceRecordIds: parsed.data.serviceRecordIds,
      providerId: parsed.data.providerId,
      fundingSourceId: parsed.data.fundingSourceId,
      actorId: user.id,
      actorRole: user.primaryRole,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
      fundingSplit: parsed.data.fundingSplit,
      verticalSplit: parsed.data.verticalSplit,
      notesForBilling: parsed.data.notesForBilling,
    });
    return jsonOk(result, 201);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Create draft from service records failed",
      400
    );
  }
}
