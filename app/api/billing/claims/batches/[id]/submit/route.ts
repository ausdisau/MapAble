import { jsonError, jsonOk } from "@/lib/api/response";
import {
  BillingAccessError,
  assertCanManageBillingOrganisation,
} from "@/lib/billing/access";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { writeFinancialAudit } from "@/lib/billing/audit/financial-audit";
import { getClaimsGateway } from "@/lib/billing/claims/gateway";
import { isPlanManagerLiveDeliveryEnabled } from "@/lib/billing/config";
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
    await assertCanManageBillingOrganisation(user, batch.organisationId);

    const gateway = getClaimsGateway(batch.gateway);
    const result = await gateway.submit(id);
    const simulated = result.simulated !== false;

    await writeFinancialAudit({
      organisationId: batch.organisationId,
      actorId: user.id,
      actorRole: user.primaryRole,
      action: simulated
        ? "claim_batch_submitted_simulated"
        : "claim_batch_submitted_plan_manager_live",
      entityType: "BillingClaimBatch",
      entityId: id,
      newValues: {
        status: result.status,
        externalReference: result.externalReference,
        simulated,
        planManagerLiveEnabled: isPlanManagerLiveDeliveryEnabled(),
        message: result.message,
      },
    });

    return jsonOk({
      result,
      simulated,
      simulatedLabel: simulated ? SIMULATED_LABEL : undefined,
    });
  } catch (e) {
    if (e instanceof BillingAccessError) {
      return jsonError(e.message, e.status);
    }
    return jsonError(
      e instanceof Error ? e.message : "Submit claim batch failed",
      400
    );
  }
}
