/**
 * Grocery supplier adapters for mapableau-new.
 *
 * Ported from REPL server/grocery-supplier.ts. All adapters are framework-
 * agnostic — they use standard fetch and process.env. Register them in a
 * Next.js API route or server action as needed.
 *
 * Required environment variables (provider-specific — all optional):
 *   GROCERY_SUPPLIER_PROVIDER          — adapter to use (default: openfoodfacts)
 *   GROCERY_SUPPLIER_CHAIN             — comma-separated chain for composite
 *   GROCERY_SUPPLIER_SEARCH_TERMS      — override search terms
 *   GROCERY_SUPPLIER_TIMEOUT_MS        — fetch timeout in ms (default 12000)
 *   GROCERY_SUPPLIER_STORE_ID/POSTCODE/SUBURB — generic location fallback
 *   WOOLWORTHS_API_KEY                 — official Woolworths API portal key
 *   WOOLWORTHS_STORE_ID/POSTCODE/SUBURB — Woolworths-specific location
 *   COLES_API_KEY / COLES_STORE_ID/POSTCODE/SUBURB
 *   IGA_STORE_ID/POSTCODE/SUBURB
 *   GROCERY_SUPPLIER_CSV_PATH          — local path or URL for CSV import
 */

import { createHash } from "crypto";
import { readFile } from "fs/promises";
import type {
  GroceryCategory,
  GrocerySupplierAdapter,
  SupplierLocation,
  SupplierProductInput,
} from "./types";
import { SupplierFetchError } from "./types";

// ---------------------------------------------------------------------------
// Category classification
// ---------------------------------------------------------------------------

const ESTIMATED_PRICE_AUD: Record<GroceryCategory, number> = {
  fresh_produce: 4.5, pantry: 3.8, dairy: 5.5, frozen: 6.5, bakery: 4.2,
  meat_seafood: 14.0, beverages: 4.0, household: 8.0, personal_care: 6.0,
};

const CATEGORY_TAG_RULES: Array<{ match: RegExp; cat: GroceryCategory }> = [
  { match: /\b(meats?|poultry|seafood|fish|salmon|chicken|beef|lamb|pork|deli)\b/i, cat: "meat_seafood" },
  { match: /\b(dairies?|dairy|milk|cheese|yogh?urts?|butter|eggs|cream)\b/i, cat: "dairy" },
  { match: /\b(beverages?|drinks?|waters?|juices?|teas?|coffees?|sodas?|soft-drinks?)\b/i, cat: "beverages" },
  { match: /\b(frozen|ice-cream)\b/i, cat: "frozen" },
  { match: /\b(breads?|bakery|pastries|bakeries|wraps?|rolls?)\b/i, cat: "bakery" },
  { match: /\b(fresh-foods?|fruits?|vegetables?|produce|bananas?|apples?|salad)\b/i, cat: "fresh_produce" },
  { match: /\b(cleaners?|detergents?|household|paper-products|laundry|toilet-paper|dishwashing)\b/i, cat: "household" },
  { match: /\b(personal-care|toiletries|hygien|soaps?|shampoos?|toothpaste|deodorant)\b/i, cat: "personal_care" },
];

type AnyRecord = Record<string, unknown>;

function classifyCategory(tags: string[]): GroceryCategory {
  for (const tag of tags)
    for (const rule of CATEGORY_TAG_RULES)
      if (rule.match.test(tag)) return rule.cat;
  return "pantry";
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const DEFAULT_SEARCH_TERMS = [
  "milk", "bread", "bananas", "chicken", "rice", "pasta",
  "frozen vegetables", "juice", "toilet paper", "shampoo",
];

function getSearchTerms(): string[] {
  return (process.env.GROCERY_SUPPLIER_SEARCH_TERMS || DEFAULT_SEARCH_TERMS.join(","))
    .split(",").map((t) => t.trim()).filter(Boolean);
}

function cleanString(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const text = String(v).replace(/\s+/g, " ").trim();
  return text || null;
}

function getPath(record: AnyRecord, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as AnyRecord)[key];
  }, record);
}

function pickString(record: AnyRecord, paths: string[]): string | null {
  for (const path of paths) {
    const text = cleanString(getPath(record, path));
    if (text) return text;
  }
  return null;
}

function isRecord(v: unknown): v is AnyRecord {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function parsePrice(v: unknown): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(2);
  const match = String(v).replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n.toFixed(2) : null;
}

function findPrice(record: AnyRecord): string | null {
  const paths = ["price", "currentPrice", "cupPrice", "salePrice", "singlePrice",
    "price.current", "price.now", "price.value", "price.amount",
    "pricing.now", "pricing.price", "pricing.currentPrice", "pricing.current",
    "pricing.price.value", "Price", "CurrentPrice", "ProductsPrice"];
  for (const path of paths) { const p = parsePrice(getPath(record, path)); if (p) return p; }
  return null;
}

function collectTags(record: AnyRecord, extra: string[] = []): string[] {
  const out: string[] = [...extra];
  const fields = ["category", "categoryName", "department", "departmentName", "aisle", "aisleName",
    "shelf", "breadcrumb", "breadcrumbs", "categories", "categories_tags"];
  for (const field of fields) {
    const value = record[field];
    if (Array.isArray(value)) {
      for (const item of value) out.push(typeof item === "string" ? item : String(item));
    } else { const t = cleanString(value); if (t) out.push(t); }
  }
  return out.filter(Boolean);
}

function imageFrom(record: AnyRecord): string | null {
  return pickString(record, ["image", "imageUrl", "image_url", "thumbnail",
    "thumbnailUrl", "smallImage", "largeImage", "productImage",
    "image_front_small_url", "image_front_url", "Image", "ImageUrl",
    "SmallImageFile", "MediumImageFile", "LargeImageFile"]);
}

function stockFrom(record: AnyRecord): boolean {
  const falseSignals = ["out of stock", "unavailable", "not available", "sold out", "false", "0", "no"];
  const trueSignals = ["in stock", "available", "true", "1", "yes"];
  for (const path of ["inStock", "available", "isAvailable", "isInStock",
    "stockAvailable", "availability", "stockStatus", "status", "productStatus"]) {
    const value = getPath(record, path);
    if (typeof value === "boolean") return value;
    const text = cleanString(value)?.toLowerCase();
    if (!text) continue;
    if (falseSignals.some((s) => text.includes(s))) return false;
    if (trueSignals.some((s) => text.includes(s))) return true;
  }
  if (record.outOfStock === true || record.isOutOfStock === true) return false;
  return true;
}

function stableId(name: string, source: string): string {
  return createHash("sha1").update(`${source}:${name}`).digest("hex").slice(0, 20);
}

function normaliseSupplierProduct(
  record: AnyRecord, supplier: string, tags: string[] = [],
): SupplierProductInput | null {
  const name = pickString(record, ["name", "productName", "displayName", "title",
    "product_name", "description", "Description", "Name"]);
  if (!name) return null;
  const id = pickString(record, ["id", "sku", "productId", "product_id", "articleId",
    "article_id", "code", "barcode", "gtin", "Stockcode", "StockCode",
    "ProductId", "id_sku", "url"]) ?? stableId(name, supplier);
  const category = classifyCategory(collectTags(record, tags));
  const price = findPrice(record);
  const unit = pickString(record, ["unit", "size", "packageSize", "package_size", "quantity",
    "unitOfMeasure", "uom", "cupMeasure", "pricing.cupMeasure",
    "Quantity", "PackageSize", "CupMeasure", "CupString"]) ?? "1 each";
  const brand = pickString(record, ["brand", "brandName", "manufacturer", "vendor",
    "Brand", "Manufacturer"]);
  const supplierUrl = pickString(record, ["url", "productUrl", "product_url", "link",
    "slug", "Url", "ProductUrl", "Slug"]);
  return {
    supplierProductId: `${supplier}:${id}`.slice(0, 190),
    name: name.slice(0, 180),
    brand: brand ? brand.slice(0, 120) : null,
    category,
    price: price ?? ESTIMATED_PRICE_AUD[category].toFixed(2),
    priceSource: price ? "supplier" : "estimated",
    unit: unit.slice(0, 80),
    description: [brand, unit].filter(Boolean).join(" — ") || null,
    image: imageFrom(record),
    supplierUrl,
    inStock: stockFrom(record),
  };
}

function extractProductRecords(body: unknown): AnyRecord[] {
  const out: AnyRecord[] = [];
  const seen = new Set<unknown>();
  const productKeys = /^(products?|items?|results?|catalogueItems|searchResults|entities|data)$/i;
  const walk = (value: unknown, depth: number) => {
    if (depth > 6 || !value || seen.has(value)) return;
    if (typeof value === "object") seen.add(value);
    if (Array.isArray(value)) {
      if (value.some((item) => isRecord(item) && ("name" in item || "Name" in item || "productName" in item))) {
        out.push(...value.filter(isRecord)); return;
      }
      for (const item of value) walk(item, depth + 1);
      return;
    }
    if (!isRecord(value)) return;
    if (value.name || value.Name || value.productName || value.displayName) out.push(value);
    for (const [key, child] of Object.entries(value)) {
      if (productKeys.test(key) || typeof child === "object") walk(child, depth + 1);
    }
  };
  walk(body, 0);
  return out;
}

async function fetchJson(supplier: string, url: string, init: RequestInit = {}): Promise<unknown> {
  const resp = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(Number(process.env.GROCERY_SUPPLIER_TIMEOUT_MS ?? "12000")),
    headers: {
      Accept: "application/json",
      "User-Agent": "MapAble/4.0 (australian-disability-ltd; +https://australiandisability.com.au)",
      ...(init.headers ?? {}),
    },
  });
  if (!resp.ok) throw new SupplierFetchError(supplier, resp.statusText, resp.status);
  const ct = resp.headers.get("content-type") ?? "";
  if (!ct.includes("json")) {
    const text = await resp.text();
    try { return JSON.parse(text); } catch {
      throw new SupplierFetchError(supplier, `Expected JSON but received ${ct || "unknown content type"}`, resp.status);
    }
  }
  return resp.json();
}

async function fetchSearchProducts(params: {
  supplier: string; limit: number; terms?: string[];
  buildRequest: (term: string, perTermLimit: number) => { url: string; init?: RequestInit; tags?: string[] };
}): Promise<SupplierProductInput[]> {
  const terms = params.terms ?? getSearchTerms();
  const perTermLimit = Math.max(4, Math.ceil(params.limit / Math.max(terms.length, 1)));
  const products: SupplierProductInput[] = [];
  const seen = new Set<string>();
  for (const term of terms) {
    if (products.length >= params.limit) break;
    const req = params.buildRequest(term, perTermLimit);
    const body = await fetchJson(params.supplier, req.url, req.init);
    for (const record of extractProductRecords(body)) {
      const p = normaliseSupplierProduct(record, params.supplier, [term, ...(req.tags ?? [])]);
      if (!p || seen.has(p.supplierProductId)) continue;
      seen.add(p.supplierProductId);
      products.push(p);
      if (products.length >= params.limit) break;
    }
  }
  return products;
}

// ---------------------------------------------------------------------------
// Location helpers
// ---------------------------------------------------------------------------

const PROVIDER_LOCATION_DEFAULTS: Record<string, Partial<SupplierLocation>> = {
  coles: { storeId: "0584" },
};

function cleanEnv(v: string | undefined): string | null {
  if (!v) return null;
  const text = String(v).trim();
  return text || null;
}

export function resolveSupplierLocation(provider: string): SupplierLocation {
  const key = provider.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  const pick = (suffix: string) =>
    cleanEnv(process.env[`${key}_${suffix}`]) ?? cleanEnv(process.env[`GROCERY_SUPPLIER_${suffix}`]);
  return { storeId: pick("STORE_ID"), postcode: pick("POSTCODE"), suburb: pick("SUBURB") };
}

export function getEffectiveSupplierLocation(provider: string): SupplierLocation {
  const resolved = resolveSupplierLocation(provider);
  const defaults = PROVIDER_LOCATION_DEFAULTS[provider.trim().toLowerCase()] ?? {};
  return {
    storeId: resolved.storeId ?? defaults.storeId ?? null,
    postcode: resolved.postcode ?? defaults.postcode ?? null,
    suburb: resolved.suburb ?? defaults.suburb ?? null,
  };
}

export function describeSupplierLocation(location: SupplierLocation): string | null {
  const parts: string[] = [];
  if (location.storeId) parts.push(`store ${location.storeId}`);
  if (location.suburb) parts.push(location.suburb);
  if (location.postcode) parts.push(location.postcode);
  return parts.length ? parts.join(", ") : null;
}

// ---------------------------------------------------------------------------
// Adapter implementations
// ---------------------------------------------------------------------------

const WOOLWORTHS_PUBLIC_API_KEY = "KaGOqzzJ3ZTjswc62prswRLXCqJ4oepSqtI2P8iM";
const COLES_PUBLIC_API_KEY = "dd6ae58532d743978508555a59a199ac";

export class OpenFoodFactsAdapter implements GrocerySupplierAdapter {
  readonly name = "openfoodfacts";
  constructor(private readonly baseUrl = "https://au.openfoodfacts.org") {}
  async fetchProducts({ limit }: { limit: number }): Promise<SupplierProductInput[]> {
    const fields = ["code", "product_name", "generic_name", "brands",
      "categories_tags", "image_front_small_url", "image_front_url", "quantity"].join(",");
    const url = `${this.baseUrl}/api/v2/search?countries_tags_en=Australia&fields=${fields}&page_size=${Math.min(Math.max(limit, 1), 100)}&sort_by=popularity_key`;
    const body = (await fetchJson(this.name, url)) as { products?: AnyRecord[] };
    const out: SupplierProductInput[] = [];
    for (const p of body.products ?? []) {
      const code = String(p.code ?? "").trim();
      const name = String(p.product_name ?? p.generic_name ?? "").trim();
      if (!code || !name) continue;
      const tags: string[] = Array.isArray(p.categories_tags) ? p.categories_tags.map(String) : [];
      const category = classifyCategory(tags);
      const brand = (Array.isArray(p.brands) ? p.brands[0] : String(p.brands ?? "").split(",")[0])?.trim() || null;
      const image = cleanString(p.image_front_small_url) || cleanString(p.image_front_url);
      const unit = String(p.quantity ?? "1 each").trim() || "1 each";
      out.push({
        supplierProductId: code, name: name.slice(0, 180),
        brand: brand ? brand.slice(0, 120) : null, category,
        price: ESTIMATED_PRICE_AUD[category].toFixed(2), priceSource: "estimated",
        unit: unit.slice(0, 80), description: brand ? `${brand} — ${unit}` : unit,
        image, supplierUrl: `https://world.openfoodfacts.org/product/${code}`, inStock: true,
      });
    }
    return out;
  }
}

export class WoolworthsAdapter implements GrocerySupplierAdapter {
  readonly name = "woolworths";
  async fetchProducts({ limit }: { limit: number }): Promise<SupplierProductInput[]> {
    if (process.env.WOOLWORTHS_API_KEY) return this._fetchOfficial(limit);
    return this._fetchPublic(limit);
  }
  private async _fetchOfficial(limit: number): Promise<SupplierProductInput[]> {
    const baseUrl = process.env.WOOLWORTHS_API_BASE_URL || "https://apiportal.woolworths.com.au";
    const searchPath = process.env.WOOLWORTHS_API_SEARCH_PATH || "/product/v1/products/search";
    const searchParam = process.env.WOOLWORTHS_API_SEARCH_PARAM || "searchTerm";
    const limitParam = process.env.WOOLWORTHS_API_LIMIT_PARAM || "pageSize";
    const storeParam = process.env.WOOLWORTHS_API_STORE_PARAM || "storeId";
    const key = process.env.WOOLWORTHS_API_KEY!;
    const location = getEffectiveSupplierLocation(this.name);
    return fetchSearchProducts({
      supplier: this.name, limit,
      buildRequest: (term, perTermLimit) => {
        const url = new URL(searchPath, baseUrl);
        url.searchParams.set(searchParam, term);
        url.searchParams.set(limitParam, String(perTermLimit));
        if (location.storeId) url.searchParams.set(storeParam, location.storeId);
        if (location.postcode) url.searchParams.set("postcode", location.postcode);
        return { url: url.toString(), tags: [term], init: { headers: { "Ocp-Apim-Subscription-Key": key, "X-Api-Key": key } } };
      },
    });
  }
  private async _fetchPublic(limit: number): Promise<SupplierProductInput[]> {
    const location = getEffectiveSupplierLocation(this.name);
    return fetchSearchProducts({
      supplier: this.name, limit,
      buildRequest: (term, perTermLimit) => ({
        url: "https://www.woolworths.com.au/apis/ui/Search/products", tags: [term],
        init: {
          method: "POST", headers: { "Content-Type": "application/json",
            "X-Api-Key": WOOLWORTHS_PUBLIC_API_KEY, "Request-Source": "MapAble" },
          body: JSON.stringify({
            SearchTerm: term, PageNumber: 1, PageSize: perTermLimit,
            SortType: "TraderRelevance", Filters: [],
            Location: `/shop/search/products?searchTerm=${encodeURIComponent(term)}`,
            ...(location.storeId ? { StoreId: location.storeId } : {}),
          }),
        },
      }),
    });
  }
}

export class ColesAdapter implements GrocerySupplierAdapter {
  readonly name = "coles";
  async fetchProducts({ limit }: { limit: number }): Promise<SupplierProductInput[]> {
    const baseUrl = process.env.COLES_API_BASE_URL || "https://apigw.coles.com.au/digital/colesappbff";
    const location = getEffectiveSupplierLocation(this.name);
    const storeId = location.storeId || "0584";
    return fetchSearchProducts({
      supplier: this.name, limit,
      buildRequest: (term, perTermLimit) => {
        const url = new URL("/v2/products/search", baseUrl);
        url.searchParams.set("searchTerm", term);
        url.searchParams.set("storeId", storeId);
        if (location.postcode) url.searchParams.set("postcode", location.postcode);
        url.searchParams.set("start", "0");
        url.searchParams.set("limit", String(perTermLimit));
        return { url: url.toString(), tags: [term],
          init: { headers: { "X-Api-Key": process.env.COLES_API_KEY || COLES_PUBLIC_API_KEY } } };
      },
    });
  }
}

export class IgaAdapter implements GrocerySupplierAdapter {
  readonly name = "iga";
  async fetchProducts({ limit }: { limit: number }): Promise<SupplierProductInput[]> {
    const baseUrl = process.env.IGA_API_BASE_URL || "https://www.igashop.com.au";
    const searchPath = process.env.IGA_API_SEARCH_PATH || "/api/products/search";
    const searchParam = process.env.IGA_API_SEARCH_PARAM || "q";
    const location = getEffectiveSupplierLocation(this.name);
    return fetchSearchProducts({
      supplier: this.name, limit,
      buildRequest: (term, perTermLimit) => {
        const url = new URL(searchPath, baseUrl);
        url.searchParams.set(searchParam, term);
        url.searchParams.set("limit", String(perTermLimit));
        if (location.storeId) url.searchParams.set("storeId", location.storeId);
        if (location.postcode) url.searchParams.set("postcode", location.postcode);
        return { url: url.toString(), tags: [term] };
      },
    });
  }
}

export class CsvSupplierAdapter implements GrocerySupplierAdapter {
  readonly name = "csv";
  async fetchProducts({ limit }: { limit: number }): Promise<SupplierProductInput[]> {
    const source = process.env.GROCERY_SUPPLIER_CSV_PATH;
    if (!source) throw new SupplierFetchError(this.name, "GROCERY_SUPPLIER_CSV_PATH must be set");
    const text = /^https?:\/\//i.test(source)
      ? await (async () => {
          const r = await fetch(source, { signal: AbortSignal.timeout(Number(process.env.GROCERY_SUPPLIER_TIMEOUT_MS ?? "12000")) });
          if (!r.ok) throw new SupplierFetchError(this.name, r.statusText, r.status);
          return r.text();
        })()
      : await readFile(source, "utf8");
    const rows = parseCsv(text);
    const products: SupplierProductInput[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      const p = normaliseSupplierProduct(mapCsvRow(row), this.name, []);
      if (!p || seen.has(p.supplierProductId)) continue;
      seen.add(p.supplierProductId);
      products.push(p);
      if (products.length >= limit) break;
    }
    return products;
  }
}

export class CompositeSupplierAdapter implements GrocerySupplierAdapter {
  readonly name: string;
  selectedProvider: string | null = null;
  constructor(private readonly adapters: GrocerySupplierAdapter[]) {
    this.name = `composite:${adapters.map((a) => a.name).join("→")}`;
  }
  async fetchProducts(opts: { limit: number }): Promise<SupplierProductInput[]> {
    const failures: string[] = [];
    this.selectedProvider = null;
    for (const adapter of this.adapters) {
      try {
        const products = await adapter.fetchProducts(opts);
        if (products.length > 0) {
          this.selectedProvider =
            adapter instanceof CompositeSupplierAdapter
              ? adapter.selectedProvider ?? adapter.name
              : adapter.name;
          return products;
        }
        failures.push(`${adapter.name}: empty result`);
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
      }
    }
    throw new SupplierFetchError(this.name, `No supplier returned products. ${failures.join("; ")}`);
  }
}

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

function parseCsv(text: string): AnyRecord[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (quoted && next === '"') { cell += '"'; i++; } else { quoted = !quoted; }
    } else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell);
      if (row.some((v) => v.trim())) rows.push(row);
      row = []; cell = "";
    } else { cell += char; }
  }
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]+/g, ""));
  return rows.slice(1).map((values) => {
    const record: AnyRecord = {};
    headers.forEach((h, i) => { if (h) record[h] = values[i]?.trim() ?? ""; });
    return record;
  });
}

function firstCsvValue(row: AnyRecord, keys: string[]): string | null {
  for (const key of keys) {
    const v = cleanString(row[key.toLowerCase().replace(/[^a-z0-9]+/g, "")]);
    if (v) return v;
  }
  return null;
}

function mapCsvRow(row: AnyRecord): AnyRecord {
  const name = firstCsvValue(row, ["name", "product name", "product", "title", "description"]);
  const brand = firstCsvValue(row, ["brand", "manufacturer"]);
  const price = firstCsvValue(row, ["price", "current price", "sale price", "unit price"]);
  const unit = firstCsvValue(row, ["unit", "size", "package size", "quantity", "weight"]);
  const category = firstCsvValue(row, ["category", "department", "aisle", "breadcrumb"]);
  const image = firstCsvValue(row, ["image", "image url", "image_url", "thumbnail"]);
  const sku = firstCsvValue(row, ["sku", "product id", "product_id", "code", "barcode", "id"]);
  const url = firstCsvValue(row, ["url", "product url", "product_url", "link"]);
  const stock = firstCsvValue(row, ["stock", "in stock", "availability", "available"]);
  return { name, brand, price, unit, category, department: category, image, imageUrl: image,
    sku, url, inStock: stock ? !/^(false|0|no|out|out of stock|unavailable)$/i.test(stock.trim()) : true };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function getSupplierProvider(): string {
  return (process.env.GROCERY_SUPPLIER_PROVIDER || "openfoodfacts").toLowerCase();
}

export function isSupplierEnabled(): boolean {
  return process.env.GROCERY_SUPPLIER_DISABLED !== "1";
}

export function buildAdapter(provider = getSupplierProvider()): GrocerySupplierAdapter {
  const n = provider.trim().toLowerCase();
  switch (n) {
    case "openfoodfacts": return new OpenFoodFactsAdapter();
    case "woolworths": return new WoolworthsAdapter();
    case "coles": return new ColesAdapter();
    case "iga": return new IgaAdapter();
    case "csv": return new CsvSupplierAdapter();
    case "composite":
    case "firstavailable":
    case "first-available": {
      const chain = (process.env.GROCERY_SUPPLIER_CHAIN || "woolworths,coles,openfoodfacts")
        .split(",").map((s) => s.trim()).filter(Boolean);
      return new CompositeSupplierAdapter(chain.map(buildAdapter));
    }
    default:
      throw new Error(`Unknown grocery supplier provider: "${provider}"`);
  }
}
