/**
 * POST /api/billing/orb/setup
 *
 * Creates an Orb customer + subscription for the authenticated user.
 * Ported from REPL POST /api/billing/setup-orb.
 *
 * Request body: (none — user derived from session)
 * Response: { orbCustomerId, orbSubscriptionId }
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  createOrbCustomer,
  createOrbSubscription,
  orbEnabled,
} from "@/lib/orb/client";

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!orbEnabled()) {
    return NextResponse.json(
      { error: "Orb is not configured (ORB_API_KEY missing)" },
      { status: 503 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, orbCustomerId: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.orbCustomerId) {
    return NextResponse.json({ orbCustomerId: user.orbCustomerId, alreadySetup: true });
  }

  const orbCustomer = await createOrbCustomer(
    user.id,
    user.name ?? user.email ?? user.id,
    user.email ?? "",
  );

  const orbSub = await createOrbSubscription(orbCustomer.id);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      orbCustomerId: orbCustomer.id,
      orbSubscriptionId: orbSub?.id ?? null,
    },
  });

  return NextResponse.json({
    orbCustomerId: orbCustomer.id,
    orbSubscriptionId: orbSub?.id ?? null,
  });
}
