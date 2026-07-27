/**
 * GET /api/grocery/supplier/status — current supplier config and last sync meta
 * Ported from REPL GET /api/grocery/supplier/status.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  getSupplierProvider,
  isSupplierEnabled,
  getEffectiveSupplierLocation,
  describeSupplierLocation,
} from "@/lib/grocery/supplier/adapters";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!["admin", "provider"].includes(user?.role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const provider = getSupplierProvider();
  const location = getEffectiveSupplierLocation(provider);
  const locationLabel = describeSupplierLocation(location);

  // Find most recent sync product
  const lastSynced = await prisma.groceryProduct.findFirst({
    orderBy: { lastSyncedAt: "desc" },
    select: { supplierSource: true, lastSyncedAt: true },
  });

  return NextResponse.json({
    enabled: isSupplierEnabled(),
    provider,
    location,
    locationLabel,
    lastSyncedAt: lastSynced?.lastSyncedAt ?? null,
    lastSyncedProvider: lastSynced?.supplierSource ?? null,
  });
}
