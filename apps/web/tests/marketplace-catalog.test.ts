import { describe, expect, it } from "vitest";

import {
  getMarketplaceProduct,
  listMarketplaceProducts,
} from "@/lib/marketplace/catalog";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/types";

describe("marketplace catalog", () => {
  it("lists products for every category", () => {
    for (const category of MARKETPLACE_CATEGORIES) {
      expect(listMarketplaceProducts(category.slug).length).toBeGreaterThan(0);
    }
  });

  it("resolves products by slug", () => {
    const product = getMarketplaceProduct("ergonomic-split-keyboard");
    expect(product?.name).toContain("keyboard");
    expect(product?.priceCents).toBe(18900);
  });

  it("does not use NDIS approved marketing on products", () => {
    const catalog = listMarketplaceProducts();
    for (const product of catalog) {
      expect(product.name.toLowerCase()).not.toContain("ndis approved");
      expect(product.description.toLowerCase()).not.toContain("ndis approved");
    }
  });
});
