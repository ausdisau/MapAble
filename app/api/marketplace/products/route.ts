import { jsonError, jsonOk } from "@/lib/api/response";
import { isMarketplaceSurfaceEnabled } from "@/lib/config/year-one-scope";
import { listMarketplaceProducts } from "@/lib/marketplace/catalog";
import {
  MARKETPLACE_CATEGORIES,
  type MarketplaceCategorySlug,
} from "@/lib/marketplace/types";

export async function GET(req: Request) {
  if (!isMarketplaceSurfaceEnabled()) {
    return jsonError(
      "MapAble Marketplace is deferred for Year-One (Core, Care, Transport, Jobs).",
      501,
    );
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as MarketplaceCategorySlug | null;
  const validCategory = MARKETPLACE_CATEGORIES.some((c) => c.slug === category)
    ? category
    : undefined;

  return jsonOk({
    categories: MARKETPLACE_CATEGORIES,
    products: listMarketplaceProducts(validCategory ?? undefined),
  });
}
