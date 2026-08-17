import { z } from "zod";

import { featureDisabledResponse } from "@/lib/access/indoor/api-errors";
import { isIndoorFeatureEnabled } from "@/lib/access/indoor/feature-flags";
import { planIndoorRoute } from "@/lib/access/indoor/routing/route-planner";
import { indoorRouteGraphSchema, routeModeSchema } from "@/lib/access/indoor/schemas/core";


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
