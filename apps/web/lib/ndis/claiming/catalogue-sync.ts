import { prisma } from "@/lib/prisma";

/** Sync active NDIS support items into the claiming price catalogue. */
export async function syncPricingCatalogueFromSupportItems() {
  const items = await prisma.ndisSupportItem.findMany({
    where: { active: true },
  });

  let upserted = 0;
  for (const item of items) {
    await prisma.ndisPricingCatalogueItem.upsert({
      where: { supportItemCode: item.code },
      create: {
        supportItemCode: item.code,
        description: item.name,
        unitType: item.unitType,
        priceLimitCents: item.priceCapCents,
        ndisSupportItemId: item.id,
        active: true,
        effectiveFrom: item.effectiveFrom,
        effectiveTo: item.effectiveTo,
      },
      update: {
        description: item.name,
        unitType: item.unitType,
        priceLimitCents: item.priceCapCents,
        ndisSupportItemId: item.id,
        active: true,
        effectiveFrom: item.effectiveFrom,
        effectiveTo: item.effectiveTo,
      },
    });
    upserted += 1;
  }
  return { upserted };
}
