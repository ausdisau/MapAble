import { jsonOk } from "@/lib/api/response";
import { listDeliveryMechanisms } from "@/lib/ndis/service-delivery/mechanism-catalog";

export async function GET() {
  return jsonOk({ mechanisms: listDeliveryMechanisms() });
}
