/**
 * POST /api/abn/verify — verify a worker's ABN (format + optional PRODA lookup)
 * Ported from REPL POST /api/workers/verify-abn.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { validateAbn } from "@/lib/ndis/abn-utils";
import {
  lookupProvider,
  prodaConfigured,
  ProdaApiError,
  ProdaNotConfiguredError,
} from "@/lib/ndis/proda-client";

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const worker = await prisma.worker.findFirst({
    where: { userId: session.user.id },
    select: { id: true, abn: true, abnVerified: true },
  });
  if (!worker) return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
  if (!worker.abn) return NextResponse.json({ error: "No ABN set on worker profile." }, { status: 400 });
  if (worker.abnVerified) return NextResponse.json({ message: "ABN already verified", abnVerified: true, abn: worker.abn });

  const formatCheck = validateAbn(worker.abn);
  if (!formatCheck.valid) return NextResponse.json({ error: formatCheck.error || "Invalid ABN format" }, { status: 400 });

  if (prodaConfigured()) {
    try {
      const result = await lookupProvider(worker.abn);
      if (result?.abn) {
        await prisma.worker.update({ where: { id: worker.id }, data: { abnVerified: true } });
        return NextResponse.json({ message: "ABN verified via NDIS provider registry", abnVerified: true, abn: worker.abn, businessName: result.businessName });
      }
      return NextResponse.json({ message: "ABN not found in NDIS provider registry", abnVerified: false }, { status: 404 });
    } catch (e) {
      if (e instanceof ProdaNotConfiguredError) return NextResponse.json({ error: e.message }, { status: 503 });
      if (e instanceof ProdaApiError) return NextResponse.json({ message: "PRODA verification temporarily unavailable.", abnVerified: false }, { status: 502 });
      return NextResponse.json({ error: "Failed to verify ABN", abnVerified: false }, { status: 500 });
    }
  }

  return NextResponse.json({
    message: "PRODA not configured — ABN format check passed but full verification unavailable.",
    abnVerified: false, formatValid: true, requiresProda: true,
  }, { status: 503 });
}
