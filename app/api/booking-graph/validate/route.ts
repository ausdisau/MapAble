import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { buildBookingGraphForCareRequest } from "@/lib/bookings/graph/graph-builder";
import { validateCareRequestTiming } from "@/lib/bookings/graph/timing-validator";

const schema = z.object({
  careRequestId: z.string().min(1),
  buildGraph: z.boolean().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = schema.parse(await req.json());
    const validation = await validateCareRequestTiming(body.careRequestId);
    let graph = null;
    if (body.buildGraph) {
      graph = await buildBookingGraphForCareRequest(body.careRequestId);
    }
    return jsonOk({ validation, graph });
  } catch (e) {
    if (e instanceof z.ZodError) return zodErrorResponse(e);
    return jsonError("Validation failed", 500);
  }
}
