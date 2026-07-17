import { jsonOk } from "@/lib/api/response";
import {
  isResponse,
  requireAnyBillingPermission,
} from "@/lib/billing/api-helpers";
import { computeBillingOverviewKpis } from "@/lib/billing/overview/kpis";

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

  const kpis = await computeBillingOverviewKpis({
    organisationId: organisationId || undefined,
    participantId: participantId || undefined,
  });

  return jsonOk({ kpis });
}
