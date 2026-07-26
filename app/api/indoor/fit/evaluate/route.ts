import { z } from "zod";

import type { AccessNeed } from "@/lib/access/fit/types";
import type { FloorPlanFeature } from "@/lib/access/floor-plan/schemas";
import { featureDisabledResponse } from "@/lib/access/indoor/api-errors";
import { isIndoorFeatureEnabled } from "@/lib/access/indoor/feature-flags";
import { evaluateIndoorFit } from "@/lib/access/indoor/fit/indoor-fit-engine";


const fitRequestSchema = z.object({
  needs: z.custom<AccessNeed>(),
  features: z.array(z.custom<FloorPlanFeature>()),
  incidents: z
    .array(
      z.object({
        featureId: z.string().nullable().optional(),
        operationalStatus: z.string(),
      }),
    )
    .optional(),
});

export async function POST(request: Request) {
  if (!isIndoorFeatureEnabled("personalAccessibilityFit")) {
    return featureDisabledResponse("personalAccessibilityFit");
  }
  const body = await request.json();
  const parsed = fitRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid fit request" }, { status: 400 });
  }
  const result = evaluateIndoorFit(
    parsed.data.needs,
    parsed.data.features,
    parsed.data.incidents ?? [],
  );
  return Response.json({ result });
}
