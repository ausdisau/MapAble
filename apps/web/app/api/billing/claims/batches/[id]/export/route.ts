import { jsonError, jsonOk } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { exportClaimBatch } from "@/lib/billing/claims/batch-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireBillingPermission("billing:export");
  if (isResponse(user)) return user;

  const { id } = await params;

  try {
    const result = await exportClaimBatch(id, {
      actorId: user.id,
      actorRole: user.primaryRole,
    });
    return jsonOk({
      result: {
        ...result,
        simulated: true,
      },
      simulated: true,
      simulatedLabel:
        "[SIMULATED] This claims path does not submit to the NDIA. No live claim was sent.",
    });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Export claim batch failed",
      400
    );
  }
}
