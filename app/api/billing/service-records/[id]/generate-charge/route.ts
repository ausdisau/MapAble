import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { generateChargeLinesFromServiceRecord } from "@/lib/billing/calculations/charge";
import { generateChargeSchema } from "@/lib/billing/schemas";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireBillingPermission("billing:create_draft");
  if (isResponse(user)) return user;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = generateChargeSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const serviceRecord = await prisma.billingServiceRecord.findUnique({
    where: { id },
  });
  if (!serviceRecord) return jsonError("Service record not found", 404);

  try {
    const result = await generateChargeLinesFromServiceRecord({
      serviceRecord,
      unitRateCents: parsed.data.unitRateCents,
      gstApplicable: parsed.data.gstApplicable,
      fundingSplit: parsed.data.fundingSplit,
      verticalSplit: parsed.data.verticalSplit,
      organisationId:
        parsed.data.organisationId ?? serviceRecord.organisationId,
    });
    return jsonOk(result);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Generate charge failed",
      400
    );
  }
}
