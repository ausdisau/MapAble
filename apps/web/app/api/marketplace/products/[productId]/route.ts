import { jsonError, jsonOk } from "@/lib/api/response";
import { isMarketplaceSurfaceEnabled } from "@/lib/config/year-one-scope";
import { getMarketplaceProduct } from "@/lib/marketplace/catalog";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  if (!isMarketplaceSurfaceEnabled()) {
    return jsonError(
      "MapAble Marketplace is deferred for Year-One (Core, Care, Transport, Jobs).",
      501,
    );
  }

  const { productId } = await params;
  const product = getMarketplaceProduct(productId);
  if (!product) return jsonError("Product not found", 404);
  return jsonOk({ product });
}
