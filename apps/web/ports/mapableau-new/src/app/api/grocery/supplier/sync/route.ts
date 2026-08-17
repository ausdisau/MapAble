/**
 * POST /api/grocery/supplier/sync  — run a grocery catalogue sync (admin only)
 * Ported from REPL POST /api/grocery/supplier/sync.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildAdapter, getSupplierProvider, isSupplierEnabled, getEffectiveSupplierLocation, describeSupplierLocation } from "@/lib/grocery/supplier/adapters";
import type { SupplierProductInput } from "@/lib/grocery/supplier/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!["admin", "provider"].includes(user?.role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isSupplierEnabled()) return NextResponse.json({ error: "Grocery supplier is disabled" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Number(body.limit ?? 50), 200);
  const provider = body.provider || getSupplierProvider();

  const adapter = buildAdapter(provider);
  const location = getEffectiveSupplierLocation(provider);
  const locationLabel = describeSupplierLocation(location);

  const products = await adapter.fetchProducts({ limit });

  let upserted = 0;
  for (const p of products) {
    await prisma.groceryProduct.upsert({
      where: { supplierProductId: p.supplierProductId },
      create: toDbRecord(p),
      update: { ...toDbRecord(p), lastSyncedAt: new Date() },
    });
    upserted++;
  }

  return NextResponse.json({
    provider: adapter.name,
    location,
    locationLabel,
    fetched: products.length,
    upserted,
    syncedAt: new Date().toISOString(),
  });
}

function toDbRecord(p: SupplierProductInput) {
  return {
    supplierProductId: p.supplierProductId,
    name: p.name,
    brand: p.brand ?? null,
    category: p.category,
    price: p.price,
    priceSource: p.priceSource,
    unit: p.unit,
    description: p.description ?? null,
    image: p.image ?? null,
    supplierUrl: p.supplierUrl ?? null,
    inStock: p.inStock,
    supplierSource: p.supplierProductId.split(":")[0] ?? "unknown",
    lastSyncedAt: new Date(),
  };
}
