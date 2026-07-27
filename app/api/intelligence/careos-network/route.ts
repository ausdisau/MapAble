import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import { buildCareOSAgenticNetwork } from "@/intelligence/network/network-service";
import { careOSNetworkRequestSchema } from "@/intelligence/network/types";
import { requireApiSession } from "@/lib/api/auth-handler";

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const config = getMapAbleIntelligenceConfig();
  if (!config.careOSNetworkEnabled) {
    return NextResponse.json(
      {
        error:
          "CareOS network intelligence is disabled. The standard MapAble services remain available.",
      },
      { status: 503 }
    );
  }

  try {
    const input = careOSNetworkRequestSchema.parse(await request.json());
    const network = await buildCareOSAgenticNetwork({ user, request: input });
    return NextResponse.json(network);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Please check the CareOS mission details.",
          issues: error.flatten(),
        },
        { status: 400 }
      );
    }

    console.error("[careos-agentic-network]", error);
    return NextResponse.json(
      {
        error:
          "CareOS could not prepare the agentic network. Use the standard dashboard instead.",
      },
      { status: 500 }
    );
  }
}
