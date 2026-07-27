import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  acknowledgeDisruption,
  listOpenDisruptions,
  listOpenRecoveries,
} from "@/lib/transport/continuity/recovery-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { transportCommandConfig } from "@/lib/config/transport-command";
import { TransportApiError } from "@/lib/transport/transport-api-error";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    if (!transportCommandConfig.commandCentreEnabled) {
      throw new TransportApiError("TRANSPORT_COMMAND_DISABLED");
    }

    const url = new URL(req.url);
    const participantId = url.searchParams.get("participantId") ?? undefined;

    const [disruptions, recoveries] = await Promise.all([
      listOpenDisruptions({ participantId }),
      listOpenRecoveries(participantId),
    ]);

    return jsonOk({ disruptions, recoveries });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = (await req.json()) as { disruptionId?: string };
    if (!body.disruptionId) {
      throw new TransportApiError("TRANSPORT_VALIDATION_FAILED");
    }
    return jsonOk(await acknowledgeDisruption(body.disruptionId, user.id));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
