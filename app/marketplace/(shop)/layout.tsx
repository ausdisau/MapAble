import Link from "next/link";

import { MarketplaceCartBadge } from "@/components/marketplace/MarketplaceCartBadge";
import { requireAuth } from "@/lib/auth/guards";
import { enforceYearOneModulePath } from "@/lib/year-one/deferred-module-gate";

/**
 * Transactional Marketplace shop — auth + MAPABLE_MARKETPLACE_ENABLED.
 * Public explainer remains at /marketplace.
 */
export default async function MarketplaceShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  enforceYearOneModulePath("/marketplace/browse");
  await requireAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <nav
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4"
          aria-label="Marketplace shop navigation"
        >
          <Link href="/marketplace" className="font-heading font-bold">
            MapAble Marketplace
          </Link>
          <Link href="/marketplace/browse" className="text-sm underline">
            Browse
          </Link>
          <Link href="/marketplace/cart" className="text-sm underline">
            Cart
            <MarketplaceCartBadge />
          </Link>
          <Link href="/dashboard/billing/invoices" className="text-sm underline">
            My orders
          </Link>
          <Link href="/core" className="ml-auto text-sm text-muted-foreground">
            MapAble Core
          </Link>
        </nav>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
