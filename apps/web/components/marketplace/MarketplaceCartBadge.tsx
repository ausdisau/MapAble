"use client";

import { useMarketplaceCartCount } from "@/components/marketplace/MarketplaceClient";

export function MarketplaceCartBadge() {
  const count = useMarketplaceCartCount();
  if (count === 0) return null;
  return (
    <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
      {count}
    </span>
  );
}
