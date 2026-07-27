/**
 * Grocery supplier adapter shared types for mapableau-new.
 * Ported from REPL server/grocery-supplier.ts.
 */

export type GroceryCategory =
  | "fresh_produce"
  | "pantry"
  | "dairy"
  | "frozen"
  | "bakery"
  | "meat_seafood"
  | "beverages"
  | "household"
  | "personal_care";

export interface SupplierProductInput {
  supplierProductId: string;
  name: string;
  brand?: string | null;
  category: GroceryCategory;
  price: string;
  priceSource: "supplier" | "estimated";
  unit: string;
  description?: string | null;
  image?: string | null;
  supplierUrl?: string | null;
  inStock: boolean;
}

export interface GrocerySupplierAdapter {
  readonly name: string;
  fetchProducts(opts: { limit: number }): Promise<SupplierProductInput[]>;
}

export interface SupplierLocation {
  storeId: string | null;
  postcode: string | null;
  suburb: string | null;
}

export interface LastSyncMeta {
  provider: string;
  location: SupplierLocation;
  locationLabel: string | null;
  syncedAt: string;
  fetched: number;
  upserted: number;
}

export class SupplierFetchError extends Error {
  constructor(
    public readonly supplier: string,
    message: string,
    public readonly status?: number,
  ) {
    super(status ? `${supplier} ${status}: ${message}` : `${supplier}: ${message}`);
    this.name = "SupplierFetchError";
  }
}
