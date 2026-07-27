/**
 * GET /api/billing/orb/usage
 *
 * Returns Orb usage summary for the authenticated user.
 * Ported from REPL GET /api/billing/orb-usage.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getCustomerUsage, orbEnabled } from "@/lib/orb/client";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!orbEnabled()) {
    return NextResponse.json({ error: "Orb not configured" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { orbCustomerId: true },
  });
  if (!user?.orbCustomerId) {
    return NextResponse.json(
      { error: "Orb not set up for this user. Call POST /api/billing/orb/setup first." },
      { status: 404 },
    );
  }

  const usage = await getCustomerUsage(user.orbCustomerId);
  return NextResponse.json(usage ?? { usage: [], subscriptionId: null });
}
