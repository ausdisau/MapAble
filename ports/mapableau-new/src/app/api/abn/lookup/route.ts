/**
 * POST /api/abn/lookup  — validate ABN and look up in ABR registry
 * Ported from REPL POST /api/abn/lookup.
 */
import { NextRequest, NextResponse } from "next/server";
import { validateAbn, lookupAbnRegistry } from "@/lib/ndis/abn-utils";

export async function POST(req: NextRequest) {
  const { abn } = await req.json();
  if (!abn) return NextResponse.json({ error: "ABN is required" }, { status: 400 });

  const validation = validateAbn(abn);
  if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });

  try {
    const result = await lookupAbnRegistry(abn);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("not found")) return NextResponse.json({ error: msg }, { status: 404 });
    return NextResponse.json({ error: "Failed to contact Australian Business Register" }, { status: 502 });
  }
}
