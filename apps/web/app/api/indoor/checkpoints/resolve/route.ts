import { z } from "zod";

import { featureDisabledResponse, indoorApiError } from "@/lib/access/indoor/api-errors";
import { verifyCheckpointToken } from "@/lib/access/indoor/checkpoints/checkpoint-validator";
import { isIndoorFeatureEnabled } from "@/lib/access/indoor/feature-flags";
import { prisma } from "@/lib/prisma";


const resolveSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isIndoorFeatureEnabled("indoorCheckpoints")) {
    return featureDisabledResponse("indoorCheckpoints");
  }

  const body = await request.json();
  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) {
    return indoorApiError("CHECKPOINT_INVALID", "Token required.", 400);
  }

  const payload = verifyCheckpointToken(parsed.data.token);
  if (!payload) {
    return indoorApiError("CHECKPOINT_INVALID", "Invalid or expired checkpoint token.", 400);
  }

  const checkpoint = await prisma.indoorCheckpoint.findFirst({
    where: {
      id: payload.checkpointId,
      placeId: payload.venueId,
      floorPlanId: payload.floorPlanId,
      active: true,
    },
  });

  if (!checkpoint) {
    return indoorApiError("CHECKPOINT_INVALID", "Checkpoint not found or inactive.", 404);
  }

  if (checkpoint.tokenVersion !== payload.tokenVersion) {
    return indoorApiError("CHECKPOINT_REVOKED", "Checkpoint token has been rotated.", 410);
  }

  const floorPlan = await prisma.accessFloorPlan.findFirst({
    where: {
      id: payload.floorPlanId,
      placeId: payload.venueId,
      publicationStatus: "published",
    },
  });

  if (!floorPlan) {
    return indoorApiError("FLOOR_PLAN_NOT_FOUND", "Floor plan version is no longer published.", 410);
  }

  return Response.json({
    checkpoint: {
      checkpointId: checkpoint.id,
      venueId: checkpoint.placeId,
      floorPlanId: checkpoint.floorPlanId,
      publicLabel: checkpoint.publicLabel,
      position: checkpoint.position,
      routeNodeId: checkpoint.routeNodeId,
    },
  });
}
