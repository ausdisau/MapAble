import { jsonOk } from "@/lib/api/response";
import { getXeroOAuthStartUrl } from "@/lib/xero/xero-service";

export async function GET() {
  const result = getXeroOAuthStartUrl();
  return jsonOk(result, result.ok ? 200 : 503);
}
