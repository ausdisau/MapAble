import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  listMarketplaceListings,
  publishMarketplaceListing,
} from "@/lib/partner/marketplace/marketplace-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await listMarketplaceListings());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.listingId) {
    const listing = await publishMarketplaceListing(body.listingId);
    return jsonOk({ listing });
  }
  const listing = await prisma.partnerMarketplaceListing.create({
    data: {
      title: body.title,
      category: body.category ?? "integration",
      organisationId: body.organisationId,
    },
  });
  return jsonOk({ listing }, 201);
}
