import { jsonOk } from "@/lib/api/response";
import { isXeroConfigured } from "@/lib/config/phase2";

function xeroNotConfiguredResponse() {
  return { configured: false, message: "Xero not configured" };
}

export async function GET() {
  if (!isXeroConfigured()) {
    return jsonOk(xeroNotConfiguredResponse(), 503);
  }
  return jsonOk({
    message: "Xero OAuth callback placeholder — configure credentials for Phase 3",
  });
}
