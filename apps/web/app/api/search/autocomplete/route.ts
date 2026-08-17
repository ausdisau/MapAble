import { NextResponse } from "next/server";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { getAuspostPacDiagnostics } from "@/lib/config/auspost-pac";
import { searchAutocompleteWithMeta } from "@/lib/search/autocomplete-service";
import { autocompleteQuerySchema } from "@/lib/search/autocomplete-validation";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120;

export async function GET(request: Request) {
  const ip = getClientIp(request);

  if (!checkIpRateLimit(`search-autocomplete:${ip}`, {
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
  })) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const signalsRaw = searchParams.get("signals");
  let signals: { recentQueries?: string[]; preferredState?: string } | undefined;
  if (signalsRaw) {
    try {
      signals = JSON.parse(signalsRaw) as {
        recentQueries?: string[];
        preferredState?: string;
      };
    } catch {
      return NextResponse.json(
        { error: "Invalid signals JSON" },
        { status: 400 },
      );
    }
  }

  const parsed = autocompleteQuerySchema.safeParse({
    q: searchParams.get("q") ?? "",
    context: searchParams.get("context") ?? "",
    field: searchParams.get("field") ?? "all",
    mode: searchParams.get("mode") ?? "reactive",
    signals,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { groups, meta } = await searchAutocompleteWithMeta({
    query: parsed.data.q,
    context: parsed.data.context,
    field: parsed.data.field,
    mode: parsed.data.mode,
    signals: parsed.data.signals,
  });

  const responseMeta =
    parsed.data.field === "location"
      ? {
          ...meta,
          locationDiagnostics: getAuspostPacDiagnostics(),
        }
      : meta;

  return NextResponse.json(
    { groups, meta: responseMeta },
    {
      headers: {
        "Cache-Control":
          parsed.data.mode === "proactive"
            ? "private, max-age=120"
            : "private, max-age=30",
      },
    },
  );
}
