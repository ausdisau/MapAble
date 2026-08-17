import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getHandoverStatus, recordHandover } from "@/lib/transport/handover-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

const handoverBodySchema = z.object({
  phase: z.enum(["pickup", "dropoff"]),
  completed: z.boolean(),
  notes: z.string().max(2000).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    return jsonOk({ handoverStatus: await getHandoverStatus(tripId) });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const body = handoverBodySchema.parse(await req.json());
    const handoverStatus = await recordHandover(user, tripId, body);
    return jsonOk({ handoverStatus });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
