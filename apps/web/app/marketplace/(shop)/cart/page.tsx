import { MarketplaceCartClient } from "@/components/marketplace/MarketplaceClient";
import { MARKETPLACE_CATALOG } from "@/lib/marketplace/catalog";

export const metadata = { title: "Cart | MapAble Marketplace" };

export default function MarketplaceCartPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Your cart</h1>
        <p className="text-muted-foreground">
          Example cart only. Checkout and invoice creation are disabled pending
          secure server-authoritative pricing, seller verification and release approval.
        </p>
      </header>
      <MarketplaceCartClient products={MARKETPLACE_CATALOG} />
    </div>
  );
}
