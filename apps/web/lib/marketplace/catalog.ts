import {
  MARKETPLACE_CATEGORIES,
  type MarketplaceCategorySlug,
  type MarketplaceProduct,
} from "@/lib/marketplace/types";

export const MARKETPLACE_CATALOG: MarketplaceProduct[] = [
  {
    id: "mp_wheelchair_light",
    slug: "lightweight-folding-wheelchair",
    name: "Lightweight folding wheelchair",
    category: "mobility-aids",
    description:
      "Compact transit wheelchair with removable footrests and attendant brakes.",
    priceCents: 89000,
    gstApplicable: true,
    ndisSupportItemCode: "05_122209311_0105_1_2",
    sellerName: "Mobility Plus AU",
    inStock: true,
  },
  {
    id: "mp_ramp_threshold",
    slug: "portable-threshold-ramp",
    name: "Portable threshold ramp",
    category: "mobility-aids",
    description: "Non-slip aluminium ramp for door thresholds up to 10 cm.",
    priceCents: 24500,
    gstApplicable: true,
    sellerName: "Access Ramps Co",
    inStock: true,
  },
  {
    id: "mp_cushion_wheelchair",
    slug: "wheelchair-pressure-cushion",
    name: "Wheelchair pressure-relief cushion",
    category: "mobility-aids",
    description: "Medium-density foam cushion with moisture-resistant cover.",
    priceCents: 7800,
    gstApplicable: true,
    sellerName: "Comfort Seating",
    inStock: true,
  },
  {
    id: "mp_overbed_table",
    slug: "adjustable-over-bed-table",
    name: "Adjustable over-bed table",
    category: "daily-living",
    description: "Tilt-top table with castors for bed or lounge use.",
    priceCents: 12900,
    gstApplicable: true,
    sellerName: "Daily Living Supplies",
    inStock: true,
  },
  {
    id: "mp_reacher",
    slug: "long-handled-reacher",
    name: "Long-handled reacher grabber",
    category: "daily-living",
    description: "Lightweight reacher with rotating jaw and magnetic tip.",
    priceCents: 3500,
    gstApplicable: true,
    sellerName: "Daily Living Supplies",
    inStock: true,
  },
  {
    id: "mp_shower_chair",
    slug: "shower-chair-with-arms",
    name: "Shower chair with arms",
    category: "daily-living",
    description: "Rust-resistant shower chair with drainage slots and non-slip feet.",
    priceCents: 19500,
    gstApplicable: true,
    sellerName: "Safe Bathing AU",
    inStock: true,
  },
  {
    id: "mp_cutlery",
    slug: "adaptive-cutlery-set",
    name: "Adaptive cutlery set (4 piece)",
    category: "daily-living",
    description: "Weighted handles with angled heads for easier grip.",
    priceCents: 4500,
    gstApplicable: true,
    sellerName: "Daily Living Supplies",
    inStock: true,
  },
  {
    id: "mp_lap_blanket",
    slug: "weighted-lap-blanket",
    name: "Weighted lap blanket (2 kg)",
    category: "sensory-products",
    description: "Calming lap blanket with washable removable cover.",
    priceCents: 8900,
    gstApplicable: true,
    sellerName: "Sensory Comfort",
    inStock: true,
  },
  {
    id: "mp_earmuffs",
    slug: "noise-cancelling-earmuffs",
    name: "Noise-reduction earmuffs",
    category: "sensory-products",
    description: "Adjustable earmuffs for sensory overload in community settings.",
    priceCents: 6500,
    gstApplicable: true,
    sellerName: "Sensory Comfort",
    inStock: true,
  },
  {
    id: "mp_keyboard",
    slug: "ergonomic-split-keyboard",
    name: "Ergonomic split keyboard",
    category: "assistive-technology",
    description: "Low-force keys with split layout for one-handed or limited reach typing.",
    priceCents: 18900,
    gstApplicable: true,
    ndisSupportItemCode: "05_222421111_0105_1_2",
    sellerName: "Assistive Tech Hub",
    inStock: true,
  },
  {
    id: "mp_tablet_mount",
    slug: "tablet-switch-mount",
    name: "Tablet stand with switch mount",
    category: "assistive-technology",
    description: "Adjustable mount for AAC apps with optional buddy button attachment.",
    priceCents: 12000,
    gstApplicable: true,
    sellerName: "Assistive Tech Hub",
    inStock: true,
  },
  {
    id: "mp_comm_board",
    slug: "communication-board",
    name: "Picture communication board",
    category: "assistive-technology",
    description: "Portable core vocabulary board with wipe-clean surface.",
    priceCents: 5500,
    gstApplicable: false,
    sellerName: "Assistive Tech Hub",
    inStock: false,
  },
];

export function listMarketplaceProducts(category?: MarketplaceCategorySlug) {
  if (!category) return MARKETPLACE_CATALOG;
  return MARKETPLACE_CATALOG.filter((p) => p.category === category);
}

export function getMarketplaceProduct(idOrSlug: string) {
  return MARKETPLACE_CATALOG.find(
    (p) => p.id === idOrSlug || p.slug === idOrSlug,
  );
}

export function getCategoryLabel(slug: MarketplaceCategorySlug) {
  return MARKETPLACE_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
