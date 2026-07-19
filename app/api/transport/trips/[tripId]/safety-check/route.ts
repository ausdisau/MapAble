import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { recordSafetyCheck } from "@/lib/transport/handover-service";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

const safetyCheckSchema = z.object({
  checkType: z.string().min(1).max(100),
  passed: z.boolean(),
  notes: z.string().max(2000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { tripId } = await params;
  try {
    const body = safetyCheckSchema.parse(await req.json());
    const handoverStatus = await recordSafetyCheck(user, tripId, body);
    return jsonOk({ handoverStatus });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
