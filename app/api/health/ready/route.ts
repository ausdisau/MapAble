import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const READY_TIMEOUT_MS = 2_500;

const noStoreHeaders = {
  "Cache-Control": "no-store",
} as const;

/**
 * Readiness probe — Node runtime + short database connectivity check.
 * Returns generic 503 on failure; never exposes hostnames, credentials,
 * schema details, stack traces, or environment values.
 */
export async function GET(): Promise<NextResponse> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), READY_TIMEOUT_MS);
      }),
    ]);

    return NextResponse.json(
      { status: "ready" },
      { status: 200, headers: noStoreHeaders },
    );
  } catch {
    return NextResponse.json(
      { status: "unavailable" },
      { status: 503, headers: noStoreHeaders },
    );
  }
}
