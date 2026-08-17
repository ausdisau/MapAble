import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { proposeRecoveryOptions } from "@/lib/transport/continuity/recovery-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

const bodySchema = z.object({
  trigger: z.enum([
    "driver_cancel",
    "vehicle_failure",
    "late_pickup",
    "route_disruption",
    "lift_outage",
    "appointment_change",
    "missing_return_trip",
  ]),
  options: z.array(
    z.object({
      optionKey: z.string(),
      label: z.string(),
      description: z.string(),
      vehicleId: z.string().optional(),
      driverId: z.string().optional(),
      providerOrganisationId: z.string().optional(),
      isLiveData: z.boolean().optional(),
      nonLiveAlternative: z.boolean().optional(),
      evidenceSummary: z.string().optional(),
      sortOrder: z.number().optional(),
    })
  ),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;

  try {
    const body = bodySchema.parse(await req.json());
    return jsonOk(
      await proposeRecoveryOptions({
        tripId,
        trigger: body.trigger,
        actorUserId: user.id,
        optionDrafts: body.options,
      })
    );
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
