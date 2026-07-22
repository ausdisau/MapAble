import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness probe — process can respond. Does not contact dependencies.
 * Safe for uptime monitors; never returns secrets or environment values.
 * Distinguishes process liveness from database readiness (`/api/health/ready`).
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { status: "ok" },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
