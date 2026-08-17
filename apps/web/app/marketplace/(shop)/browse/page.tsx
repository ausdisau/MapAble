import Link from "next/link";

import { MarketplaceProductCard } from "@/components/marketplace/MarketplaceClient";
import {
  getCategoryLabel,
  listMarketplaceProducts,
} from "@/lib/marketplace/catalog";
import {
  MARKETPLACE_CATEGORIES,
  type MarketplaceCategorySlug,
} from "@/lib/marketplace/types";

export const metadata = {
  title: "Browse | MapAble Marketplace",
};

export default async function MarketplaceBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: rawCategory } = await searchParams;
  const category = MARKETPLACE_CATEGORIES.some((c) => c.slug === rawCategory)
    ? (rawCategory as MarketplaceCategorySlug)
    : undefined;
  const products = listMarketplaceProducts(category);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">
          {category ? getCategoryLabel(category) : "Browse products"}
        </h1>
        <p className="text-muted-foreground">
          {products.length} product{products.length === 1 ? "" : "s"}
          {category ? ` in ${getCategoryLabel(category).toLowerCase()}` : ""}.
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Product categories">
        <Link
          href="/marketplace/browse"
          className={`rounded-full border px-3 py-1 text-sm ${
            !category ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          }`}
        >
          All
        </Link>
        {MARKETPLACE_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/marketplace/browse?category=${cat.slug}`}
            className={`rounded-full border px-3 py-1 text-sm ${
              category === cat.slug ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground">No products in this category yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <MarketplaceProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
