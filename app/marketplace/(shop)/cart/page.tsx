import { MarketplaceCartClient } from "@/components/marketplace/MarketplaceClient";
import { MARKETPLACE_CATALOG } from "@/lib/marketplace/catalog";

export const metadata = { title: "Cart | MapAble Marketplace" };

export default function MarketplaceCartPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Your cart</h1>
        <p className="text-muted-foreground">
          Review items before creating a billing invoice. Payment continues in the billing
          centre.
        </p>
      </header>
      <MarketplaceCartClient products={MARKETPLACE_CATALOG} />
    </div>
  );
}
