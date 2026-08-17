import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getUnifiedCareTransportState } from "@/lib/orchestration/care-transport-orchestrator";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ careRequestId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { careRequestId } = await ctx.params;
  const state = await getUnifiedCareTransportState(careRequestId);
  return jsonOk({ state });
}
