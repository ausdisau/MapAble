import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { lockServiceRecordSchema } from "@/lib/billing/schemas";
import { lockServiceRecord } from "@/lib/billing/service-records/service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireBillingPermission("billing:edit_draft");
  if (isResponse(user)) return user;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = lockServiceRecordSchema.safeParse({
    ...body,
    serviceRecordId: id,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const serviceRecord = await lockServiceRecord({
      serviceRecordId: parsed.data.serviceRecordId,
      actorId: user.id,
      actorRole: user.primaryRole,
      reason: parsed.data.reason,
    });
    return jsonOk({ serviceRecord });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Lock service record failed",
      400
    );
  }
}
