import type { GroceryProduct, InsertGroceryProduct } from "@shared/schema";

export type GroceryCategory = GroceryProduct["category"];

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

const ESTIMATED_PRICE_AUD: Record<GroceryCategory, number> = {
  fresh_produce: 4.5,
  pantry: 3.8,
  dairy: 5.5,
  frozen: 6.5,
  bakery: 4.2,
  meat_seafood: 14.0,
  beverages: 4.0,
  household: 8.0,
  personal_care: 6.0,
};

const CATEGORY_TAG_RULES: Array<{ match: RegExp; cat: GroceryCategory }> = [
  { match: /\b(meats?|poultry|seafood|fish|salmon|chicken|beef|lamb|pork)\b/i, cat: "meat_seafood" },
  { match: /\b(dairies|dairy|milk|cheese|yogh?urts?|butter|eggs)\b/i, cat: "dairy" },
  { match: /\b(beverages|drinks|waters|juices|teas|coffees|sodas)\b/i, cat: "beverages" },
  { match: /\b(frozen)\b/i, cat: "frozen" },
  { match: /\b(breads?|bakery|pastries|bakeries)\b/i, cat: "bakery" },
  { match: /\b(fresh-foods|fruits|vegetables|produce)\b/i, cat: "fresh_produce" },
  { match: /\b(cleaners?|detergents?|household|paper-products|laundry)\b/i, cat: "household" },
  { match: /\b(personal-care|toiletries|hygien|soaps?|shampoos?|toothpaste)\b/i, cat: "personal_care" },
];

function classifyCategory(tags: string[]): GroceryCategory {
  for (const tag of tags) {
    for (const rule of CATEGORY_TAG_RULES) if (rule.match.test(tag)) return rule.cat;
  }
  return "pantry";
}

export class OpenFoodFactsAdapter implements GrocerySupplierAdapter {
  readonly name = "openfoodfacts";
  constructor(private readonly baseUrl: string = "https://au.openfoodfacts.org") {}

  async fetchProducts({ limit }: { limit: number }): Promise<SupplierProductInput[]> {
    const fields = [
      "code",
      "product_name",
      "generic_name",
      "brands",
      "categories_tags",
      "image_front_small_url",
      "image_front_url",
      "quantity",
    ].join(",");
    const pageSize = Math.min(Math.max(limit, 1), 100);
    const url = `${this.baseUrl}/api/v2/search?countries_tags_en=Australia&fields=${fields}&page_size=${pageSize}&sort_by=popularity_key`;
    const resp = await fetch(url, {
      headers: {
        // Open Food Facts requests a descriptive UA so they can throttle abuse.
        "User-Agent": "MapAble/4.0 (australian-disability-ltd; +https://australiandisability.com.au)",
        Accept: "application/json",
      },
    });
    if (!resp.ok) {
      throw new Error(`Open Food Facts ${resp.status}: ${resp.statusText}`);
    }
    const body = (await resp.json()) as { products?: Array<Record<string, any>> };
    const out: SupplierProductInput[] = [];
    for (const p of body.products ?? []) {
      const code = String(p.code ?? "").trim();
      const name = String(p.product_name ?? p.generic_name ?? "").trim();
      if (!code || !name) continue;
      const tags: string[] = Array.isArray(p.categories_tags) ? p.categories_tags.map(String) : [];
      const category = classifyCategory(tags);
      const brand = (Array.isArray(p.brands) ? p.brands[0] : String(p.brands ?? "").split(",")[0])?.trim() || null;
      const image = p.image_front_small_url || p.image_front_url || null;
      const unit = String(p.quantity ?? "1 each").trim() || "1 each";
      out.push({
        supplierProductId: code,
        name: name.slice(0, 180),
        brand: brand ? brand.slice(0, 120) : null,
        category,
        price: ESTIMATED_PRICE_AUD[category].toFixed(2),
        priceSource: "estimated",
        unit: unit.slice(0, 80),
        description: brand ? `${brand} — ${unit}` : unit,
        image,
        supplierUrl: `https://world.openfoodfacts.org/product/${code}`,
        inStock: true,
      });
    }
    return out;
  }
}

export function isSupplierEnabled(): boolean {
  return process.env.GROCERY_SUPPLIER_DISABLED !== "1";
}

export function getSupplierProvider(): string {
  return process.env.GROCERY_SUPPLIER_PROVIDER || "openfoodfacts";
}

export function buildAdapter(): GrocerySupplierAdapter {
  const provider = getSupplierProvider();
  switch (provider) {
    case "openfoodfacts":
      return new OpenFoodFactsAdapter(process.env.GROCERY_SUPPLIER_BASE_URL);
    default:
      throw new Error(`Unknown grocery supplier provider: ${provider}`);
  }
}

export function getSupplierLimit(): number {
  const raw = Number(process.env.GROCERY_SUPPLIER_LIMIT ?? "60");
  if (!Number.isFinite(raw) || raw <= 0) return 60;
  return Math.min(Math.floor(raw), 100);
}

export function toInsertProduct(p: SupplierProductInput, source: string): InsertGroceryProduct {
  return {
    name: p.name,
    brand: p.brand ?? null,
    category: p.category,
    price: p.price,
    unit: p.unit,
    description: p.description ?? null,
    image: p.image ?? null,
    inStock: p.inStock,
    supplierSource: source,
    supplierProductId: p.supplierProductId,
    supplierUrl: p.supplierUrl ?? null,
    priceSource: p.priceSource,
    lastSyncedAt: new Date(),
  };
}
