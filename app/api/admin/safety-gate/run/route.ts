import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import {
  assertSafetyGatePassed,
  runCareOSSafetyGate,
} from "@/lib/careos/opportunities/safety-evaluation-gate";

export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  try {
    const report = runCareOSSafetyGate();
    assertSafetyGatePassed(report);
    return NextResponse.json({
      ok: true,
      signature: report.signature,
      prohibitedRegistrySize: report.prohibitedRegistrySize,
      runAt: report.runAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GATE_FAILED";
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }
}
