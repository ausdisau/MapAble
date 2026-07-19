import { jsonError, jsonOk } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { getClaimsGateway } from "@/lib/billing/claims/gateway";
import { prisma } from "@/lib/prisma";

const SIMULATED_LABEL =
  "[SIMULATED] This claims path does not submit to the NDIA. No live claim was sent.";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireBillingPermission("billing:export");
  if (isResponse(user)) return user;

  const { id } = await params;
  const batch = await prisma.billingClaimBatch.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!batch) return jsonError("Claim batch not found", 404);

  try {
    const gateway = getClaimsGateway(batch.gateway);
    const status = batch.externalReference
      ? await gateway.getStatus(batch.externalReference)
      : {
          externalReference: id,
          status: batch.status,
          simulated: true as const,
          details: SIMULATED_LABEL,
        };

    return jsonOk({
      batch: {
        ...batch,
        simulated: true,
      },
      status: {
        ...status,
        simulated: true,
        details: status.details ?? SIMULATED_LABEL,
      },
      simulated: true,
      simulatedLabel: SIMULATED_LABEL,
    });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Claim batch status failed",
      400
    );
  }
}
