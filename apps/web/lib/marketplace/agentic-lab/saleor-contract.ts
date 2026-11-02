/**
 * Optional Saleor catalogue adapter contract — not a connection.
 * Product fields only. Care/support delivery remains under MapAble Core/Care.
 * Saleor app credentials must never enter browser code or AI tool outputs.
 */
export interface SaleorPublicProductProjection {
  readonly productId: string;
  readonly variantId: string;
  readonly channel: string;
  readonly name: string;
  readonly currency: "AUD";
  readonly grossPriceCents: number | null;
  readonly sourceObservedAt: string;
  readonly sellerIdentityVerification: "unverified" | "externally_verified";
  readonly productSafety: "unknown" | "human_reviewed";
}
export interface MarketplaceProductDraft {
  readonly source: "saleor_public_catalogue_adapter";
  readonly saleorProductId: string;
  readonly variantId: string;
  readonly exampleDisplayPriceCents: number | null;
  readonly currency: "AUD";
  readonly evidence: "unverified" | "human_reviewed";
  readonly binding: false;
  readonly ndisFundingStatus: "not_determined";
}
export function projectSaleorProduct(source: SaleorPublicProductProjection): MarketplaceProductDraft {
  if (!source.productId || !source.variantId || !source.channel) {
    throw new Error("SALEOR_SOURCE_INVALID");
  }
  if (source.currency !== "AUD") throw new Error("CURRENCY_UNSUPPORTED");
  if (source.grossPriceCents !== null &&
    (!Number.isSafeInteger(source.grossPriceCents) || source.grossPriceCents < 0)) {
    throw new Error("PRICE_INVALID");
  }
  return {
    source: "saleor_public_catalogue_adapter",
    saleorProductId: source.productId,
    variantId: source.variantId,
    exampleDisplayPriceCents: source.grossPriceCents,
    currency: "AUD",
    evidence: source.sellerIdentityVerification === "externally_verified" &&
      source.productSafety === "human_reviewed" ? "human_reviewed" : "unverified",
    binding: false,
    ndisFundingStatus: "not_determined",
  };
}
/** Never equate an app-generated example price with Saleor's authoritative checkout total. */
export function reviewSaleorWrite(_operation: string): { allowed: false; reason: string } {
  return { allowed: false, reason: "Saleor checkout, payment, inventory and order writes disabled; human/finance approval required." };
}
export const SALEOR_NETWORK_ADAPTER_ENABLED = false as const;
