import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireAnyBillingPermission,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { createServiceRecordSchema } from "@/lib/billing/schemas";
import {
  createFromSource,
  listUnbilled,
} from "@/lib/billing/service-records/service";

export async function GET(req: Request) {
  const user = await requireAnyBillingPermission([
    "billing:view_own",
    "billing:view_all",
    "billing:view_provider",
  ]);
  if (isResponse(user)) return user;

  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId");
  const participantId = url.searchParams.get("participantId");
  const take = url.searchParams.get("take");

  const records = await listUnbilled({
    organisationId: organisationId || undefined,
    participantId: participantId || undefined,
    take: take ? Number(take) : undefined,
  });

  return jsonOk({ serviceRecords: records });
}

export async function POST(req: Request) {
  const user = await requireBillingPermission("billing:create_draft");
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => ({}));
  const parsed = createServiceRecordSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const record = await createFromSource({
      organisationId: parsed.data.organisationId,
      participantId: parsed.data.participantId,
      sourceType: parsed.data.sourceType,
      sourceId: parsed.data.sourceId,
      serviceType: parsed.data.serviceType,
      serviceStart: new Date(parsed.data.serviceStart),
      serviceEnd: parsed.data.serviceEnd
        ? new Date(parsed.data.serviceEnd)
        : null,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit,
      supportItemCode: parsed.data.supportItemCode,
      workerOrProviderId: parsed.data.workerOrProviderId,
      fundingSourceType: parsed.data.fundingSourceType,
      estimatedCents: parsed.data.estimatedCents,
      notesForBilling: parsed.data.notesForBilling,
      actorId: user.id,
      actorRole: user.primaryRole,
    });
    return jsonOk({ serviceRecord: record }, 201);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Create service record failed",
      400
    );
  }
}
