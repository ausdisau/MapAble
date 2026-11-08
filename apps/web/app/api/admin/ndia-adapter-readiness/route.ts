import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getNdiaGatewayReadiness } from "@/lib/ndis/api-gateway/ndia-gateway-contract";

/**
 * Read-only administrative status: never expose credentials, personal records,
 * vendor portal metadata or unverified claims of government approval.
 */
export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(getNdiaGatewayReadiness());
}
