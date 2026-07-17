import { z } from "zod";

import { featureDisabledResponse } from "@/lib/indoor-accessibility/api-errors";
import { isIndoorFeatureEnabled } from "@/lib/indoor-accessibility/feature-flags";
import { planIndoorRoute } from "@/lib/indoor-accessibility/routing/route-planner";
import { indoorRouteGraphSchema, routeModeSchema } from "@/lib/indoor-accessibility/schemas/core";


const routeRequestSchema = z.object({
  graph: indoorRouteGraphSchema,
  fromNodeId: z.string(),
  toNodeId: z.string(),
  mode: routeModeSchema.default("step_free"),
  minDoorWidthMm: z.number().optional(),
  unavailableEdgeIds: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  if (!isIndoorFeatureEnabled("verifiedIndoorRouting")) {
    return featureDisabledResponse("verifiedIndoorRouting");
  }
  const body = await request.json();
  const parsed = routeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid route request" }, { status: 400 });
  }
  const result = planIndoorRoute({
    ...parsed.data,
    unavailableEdgeIds: parsed.data.unavailableEdgeIds
      ? new Set(parsed.data.unavailableEdgeIds)
      : undefined,
  });
  return Response.json({ result });
}
