import { NextResponse } from "next/server";

import { isCspPreviewEnforceEnabled } from "@/lib/security/csp-preview-enforce";
import {
  redactCspViolationReport,
  type CspViolationReport,
} from "@/lib/security/csp-violation-redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Preview-oriented CSP report sink.
 * Accepts reports always (report-only) but only logs redacted evidence when
 * the preview enforce flag is on. Never echoes secrets or script samples.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CspViolationReport;
    const redacted = redactCspViolationReport(body);
    if (isCspPreviewEnforceEnabled()) {
      console.info(
        JSON.stringify({
          type: "csp_violation_redacted",
          ...redacted,
        }),
      );
    }
    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "invalid_report" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
