import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketplaceAddToCartButton } from "@/components/marketplace/MarketplaceClient";
import { getCategoryLabel, getMarketplaceProduct } from "@/lib/marketplace/catalog";
import { formatMarketplacePrice } from "@/lib/marketplace/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = getMarketplaceProduct(productId);
  return { title: product ? `${product.name} | MapAble Marketplace` : "Product" };
}

export default async function MarketplaceProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = getMarketplaceProduct(productId);
  if (!product) notFound();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div
        className="flex min-h-64 items-center justify-center rounded-xl bg-muted text-muted-foreground"
        aria-hidden
      >
        {getCategoryLabel(product.category)}
      </div>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{getCategoryLabel(product.category)}</p>
        <h1 className="font-heading text-3xl font-bold">{product.name}</h1>
        <p className="text-muted-foreground">{product.description}</p>
        <p className="text-sm text-muted-foreground">Sold by {product.sellerName}</p>
        {product.ndisSupportItemCode ? (
          <p className="text-sm">
            NDIS support item reference:{" "}
            <code className="rounded bg-muted px-1">{product.ndisSupportItemCode}</code>
            . Plan manager review may be required — not a claim approval.
          </p>
        ) : null}
        <p className="text-2xl font-semibold">{formatMarketplacePrice(product.priceCents)}</p>
        <div className="flex flex-wrap gap-3">
          <MarketplaceAddToCartButton product={product} />
          <Link
            href="/marketplace/cart"
            className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            Go to cart
          </Link>
        </div>
        <Link href="/marketplace/browse" className="text-sm text-primary underline">
          Back to browse
        </Link>
      </div>
    </div>
  );
}
