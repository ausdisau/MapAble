import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  assessVehicleCompatibility,
  listVehicleEvidence,
} from "@/lib/transport/accessibility/evidence-service";
import { parseMobilityRequirements } from "@/lib/transport/mobility-schema";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { transportCommandConfig } from "@/lib/config/transport-command";
import { TransportApiError } from "@/lib/transport/transport-api-error";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { vehicleId } = await params;

  try {
    if (!transportCommandConfig.commandCentreEnabled) {
      throw new TransportApiError("TRANSPORT_COMMAND_DISABLED");
    }

    const url = new URL(req.url);
    const mobilityRaw = url.searchParams.get("mobilityRequirements");
    const mobility = mobilityRaw
      ? parseMobilityRequirements(JSON.parse(mobilityRaw))
      : {};

    const [evidence, compatibility] = await Promise.all([
      listVehicleEvidence(vehicleId),
      assessVehicleCompatibility(vehicleId, mobility),
    ]);

    return jsonOk({ evidence, compatibility });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
