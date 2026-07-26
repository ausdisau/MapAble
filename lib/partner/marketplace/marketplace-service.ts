import { phase8Config } from "@/lib/config/phase8";
import { prisma } from "@/lib/prisma";

export async function listMarketplaceListings() {
  if (!phase8Config.partnerMarketplaceEnabled) {
    return { disabled: true, listings: [] as never[] };
  }
  const listings = await prisma.partnerMarketplaceListing.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 30,
  });
  return { disabled: false, listings };
}

export async function publishMarketplaceListing(listingId: string) {
  if (!phase8Config.partnerMarketplaceEnabled) {
    throw new Error("PARTNER_MARKETPLACE_DISABLED");
  }
  return prisma.partnerMarketplaceListing.update({
    where: { id: listingId },
    data: { status: "published", publishedAt: new Date() },
  });
}
