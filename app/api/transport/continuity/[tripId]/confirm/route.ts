import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { confirmRecoveryOption } from "@/lib/transport/continuity/recovery-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

const bodySchema = z.object({
  requestId: z.string(),
  optionId: z.string(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  await params;

  try {
    const body = bodySchema.parse(await req.json());
    return jsonOk(
      await confirmRecoveryOption({
        requestId: body.requestId,
        optionId: body.optionId,
        confirmedByUserId: user.id,
        participantId: user.id,
      })
    );
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
