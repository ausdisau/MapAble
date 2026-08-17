import { requireApiPermission } from "@/lib/api/auth-handler";
import {
  isResponse,
  jsonError,
  jsonOk,
  zodErrorResponse,
} from "@/lib/api/response";
import { isNdisServiceDeliveryMechanismEnabled } from "@/lib/config/ndis-service-delivery";
import { assertOrgAccess } from "@/lib/ndis/claiming/claim-service";
import { recordDeliveryEventSchema } from "@/lib/ndis/schemas";
import { recordDeliveryEvent } from "@/lib/ndis/service-delivery/delivery-event-service";

export async function POST(req: Request) {
  const user = await requireApiPermission("provider:ndis:claim");
  if (isResponse(user)) return user;
  if (!isNdisServiceDeliveryMechanismEnabled()) {
    return jsonError("NDIS service delivery mechanism is disabled", 503);
  }

  const parsed = recordDeliveryEventSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await assertOrgAccess(user, parsed.data.providerOrgId);
    const event = await recordDeliveryEvent({
      ...parsed.data,
      serviceDate: new Date(parsed.data.serviceDate),
      createdById: user.id,
    });
    return jsonOk({ event }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (msg === "NDIS_SERVICE_DELIVERY_DISABLED") {
      return jsonError("NDIS service delivery mechanism is disabled", 503);
    }
    return jsonError(msg, 400);
  }
}
