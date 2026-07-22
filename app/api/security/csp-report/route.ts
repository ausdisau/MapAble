import { NextResponse } from "next/server";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { isCspPreviewEnforceEnabled } from "@/lib/security/csp-preview-enforce";
import { parseCspReportPayload } from "@/lib/security/csp-report-schema";
import {
  extractCspReports,
  redactCspViolationReport,
} from "@/lib/security/csp-violation-redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Hard cap — CSP reports are small; reject oversized bodies as abuse. */
const MAX_BODY_BYTES = 8_192;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 60;

const ALLOWED_CONTENT_TYPES = [
  "application/csp-report",
  "application/json",
  "application/reports+json",
] as const;

const noStore = { "Cache-Control": "no-store" } as const;

function contentTypeAllowed(header: string | null): boolean {
  if (!header) return false;
  const base = header.split(";")[0]?.trim().toLowerCase() ?? "";
  return (ALLOWED_CONTENT_TYPES as readonly string[]).includes(base);
}

/**
 * Reject oversized Content-Length before buffering. Missing headers still
 * fall through to the post-read byteLength check (dishonest/absent CL).
 */
function earlyContentLengthRejection(
  request: Request,
): NextResponse | null {
  const raw = request.headers.get("content-length");
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return NextResponse.json(
      { error: "invalid_content_length" },
      { status: 400, headers: noStore },
    );
  }
  const length = Number(trimmed);
  if (!Number.isSafeInteger(length) || length < 0) {
    return NextResponse.json(
      { error: "invalid_content_length" },
      { status: 400, headers: noStore },
    );
  }
  if (length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "payload_too_large" },
      { status: 413, headers: noStore },
    );
  }
  if (length === 0) {
    return NextResponse.json(
      { error: "invalid_report" },
      { status: 400, headers: noStore },
    );
  }
  return null;
}

/**
 * CSP report sink (report-only + preview enforce).
 *
 * Hardening:
 * - content-type allowlist
 * - early Content-Length rejection + post-read body size cap
 * - Zod schema validation with field/array/object bounds
 * - process-local IP rate limit (not distributed — see RATE_LIMITING.md)
 * - redaction only (no script samples / secrets / query strings)
 * - empty 204 success; never echo the report body
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!contentTypeAllowed(request.headers.get("content-type"))) {
    return NextResponse.json(
      { error: "unsupported_media_type" },
      { status: 415, headers: noStore },
    );
  }

  const early = earlyContentLengthRejection(request);
  if (early) return early;

  const ip = getClientIp(request);
  if (
    !checkIpRateLimit(`csp-report:${ip}`, {
      windowMs: RATE_WINDOW_MS,
      max: RATE_MAX,
    })
  ) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: noStore },
    );
  }

  const raw = await request.arrayBuffer();
  if (raw.byteLength === 0) {
    return NextResponse.json(
      { error: "invalid_report" },
      { status: 400, headers: noStore },
    );
  }
  if (raw.byteLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "payload_too_large" },
      { status: 413, headers: noStore },
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder("utf-8").decode(raw));
  } catch {
    return NextResponse.json(
      { error: "invalid_report" },
      { status: 400, headers: noStore },
    );
  }

  const validated = parseCspReportPayload(payload);
  if (!validated.ok) {
    return NextResponse.json(
      { error: "invalid_report" },
      { status: 400, headers: noStore },
    );
  }

  const reports = extractCspReports(validated.data);
  if (reports.length === 0 || reports.length > 20) {
    return NextResponse.json(
      { error: "invalid_report" },
      { status: 400, headers: noStore },
    );
  }

  if (isCspPreviewEnforceEnabled()) {
    for (const report of reports) {
      const redacted = redactCspViolationReport(report);
      console.info(
        JSON.stringify({
          type: "csp_violation_redacted",
          ...redacted,
        }),
      );
    }
  }

  return new NextResponse(null, {
    status: 204,
    headers: noStore,
  });
}
