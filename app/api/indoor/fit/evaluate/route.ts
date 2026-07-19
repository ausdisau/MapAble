import { z } from "zod";

import type { AccessNeed } from "@/lib/access-fit/types";
import type { FloorPlanFeature } from "@/lib/floor-plan/schemas";
import { featureDisabledResponse } from "@/lib/indoor-accessibility/api-errors";
import { isIndoorFeatureEnabled } from "@/lib/indoor-accessibility/feature-flags";
import { evaluateIndoorFit } from "@/lib/indoor-accessibility/fit/indoor-fit-engine";


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
