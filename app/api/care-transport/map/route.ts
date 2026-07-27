import { NextResponse } from "next/server";
import { z } from "zod";

import { getOptionalApiUser } from "@/lib/api/optional-session";
import { isCareTransportMapEnabled } from "@/lib/config/care-transport-map";
import {
  buildCareTransportMapPayload,
  type CareTransportMapLayer,
} from "@/lib/transport/care-map/map-payload";

const layerSchema = z.enum(["careProviders", "infrastructure", "trips"]);

const querySchema = z.object({
  layers: z.string().optional(),
  includeTrips: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

export async function GET(request: Request) {
  if (!isCareTransportMapEnabled()) {
    return NextResponse.json(
      {
        error: "Care + Transport map is not enabled",
        code: "FEATURE_DISABLED",
      },
      { status: 404 },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    layers: searchParams.get("layers") ?? undefined,
    includeTrips: searchParams.get("includeTrips") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  let layers: CareTransportMapLayer[] | undefined;
  if (parsed.data.layers) {
    const parts = parsed.data.layers.split(",").map((s) => s.trim());
    const validated: CareTransportMapLayer[] = [];
    for (const part of parts) {
      const r = layerSchema.safeParse(part);
      if (!r.success) {
        return NextResponse.json(
          { error: `Unknown layer: ${part}` },
          { status: 400 },
        );
      }
      validated.push(r.data);
    }
    layers = validated;
  }

  const user = await getOptionalApiUser();
  const includeTrips = Boolean(parsed.data.includeTrips && user?.id);

  const payload = await buildCareTransportMapPayload({
    layers,
    includeTrips,
    participantUserId: user?.id ?? null,
  });

  return NextResponse.json(payload);
}
