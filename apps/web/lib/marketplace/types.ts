export const MARKETPLACE_CATEGORIES = [
  {
    slug: "mobility-aids",
    label: "Mobility aids",
    description: "Wheelchairs, ramps, cushions and mobility supports",
  },
  {
    slug: "daily-living",
    label: "Daily living",
    description: "Equipment for independence at home",
  },
  {
    slug: "sensory-products",
    label: "Sensory products",
    description: "Comfort and sensory regulation tools",
  },
  {
    slug: "assistive-technology",
    label: "Assistive technology",
    description: "Keyboards, mounts and communication aids",
  },
] as const;

export type MarketplaceCategorySlug =
  (typeof MARKETPLACE_CATEGORIES)[number]["slug"];

export type MarketplaceProduct = {
  id: string;
  slug: string;
  name: string;
  category: MarketplaceCategorySlug;
  description: string;
  priceCents: number;
  gstApplicable: boolean;
  ndisSupportItemCode?: string;
  sellerName: string;
  inStock: boolean;
};

export type MarketplaceCartItem = {
  productId: string;
  quantity: number;
};
