import { NextResponse } from "next/server";

import { canTriggerAdminIngestion } from "@/lib/admin/cron-auth";
import { runNdisProviderIngestion } from "@/lib/ingestion/ndis-providers";

export const maxDuration = 300;

export async function POST(request: Request) {
  const allowed = await canTriggerAdminIngestion(request);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runNdisProviderIngestion({ dryRun: false });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ingestion failed",
          durationMs: result.durationMs,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      providerCount: result.providerCount,
      runId: result.runId ?? null,
      durationMs: result.durationMs,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Ingestion failed" },
      { status: 500 },
    );
  }
}
