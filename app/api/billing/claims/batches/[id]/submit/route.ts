import { jsonError, jsonOk } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { writeFinancialAudit } from "@/lib/billing/audit/financial-audit";
import { getClaimsGateway } from "@/lib/billing/claims/gateway";
import { prisma } from "@/lib/prisma";

const SIMULATED_LABEL =
  "[SIMULATED] This claims path does not submit to the NDIA. No live claim was sent.";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireBillingPermission("billing:export");
  if (isResponse(user)) return user;

  const { id } = await params;
  const batch = await prisma.billingClaimBatch.findUnique({
    where: { id },
  });
  if (!batch) return jsonError("Claim batch not found", 404);

  try {
    const gateway = getClaimsGateway(batch.gateway);
    const result = await gateway.submit(id);

    await prisma.billingClaimBatch.update({
      where: { id },
      data: { simulated: true },
    });

    await writeFinancialAudit({
      organisationId: batch.organisationId,
      actorId: user.id,
      actorRole: user.primaryRole,
      action: "claim_batch_submitted_simulated",
      entityType: "BillingClaimBatch",
      entityId: id,
      newValues: {
        status: result.status,
        externalReference: result.externalReference,
        simulated: true,
        message: SIMULATED_LABEL,
      },
    });

    return jsonOk({
      result: {
        ...result,
        simulated: true,
        message: result.message?.includes("[SIMULATED]")
          ? result.message
          : `${SIMULATED_LABEL} ${result.message ?? ""}`.trim(),
      },
      simulated: true,
      simulatedLabel: SIMULATED_LABEL,
    });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Submit claim batch failed",
      400
    );
  }
}
