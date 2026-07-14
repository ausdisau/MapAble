import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  assureReturnTrip,
  getReturnTripAssurance,
  linkReturnTrip,
} from "@/lib/transport/continuity/return-trip-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;

  try {
    return jsonOk(await getReturnTripAssurance(tripId));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

const postSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("link"),
    returnTripId: z.string(),
  }),
  z.object({
    action: z.literal("assure"),
    status: z.enum(["assured", "at_risk", "missing"]).optional(),
    notes: z.string().optional(),
  }),
]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;

  try {
    const body = postSchema.parse(await req.json());
    if (body.action === "link") {
      return jsonOk(
        await linkReturnTrip({
          outboundTripId: tripId,
          returnTripId: body.returnTripId,
          actorUserId: user.id,
        })
      );
    }
    return jsonOk(
      await assureReturnTrip({
        outboundTripId: tripId,
        actorUserId: user.id,
        status: body.status,
        notes: body.notes,
      })
    );
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
