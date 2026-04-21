import { createHash } from "crypto";
import { readFile } from "fs/promises";
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

type AnyRecord = Record<string, unknown>;

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
  { match: /\b(meats?|poultry|seafood|fish|salmon|chicken|beef|lamb|pork|deli)\b/i, cat: "meat_seafood" },
  { match: /\b(dairies|dairy|milk|cheese|yogh?urts?|butter|eggs|cream)\b/i, cat: "dairy" },
  { match: /\b(beverages|drinks|waters|juices|teas|coffees|sodas|soft-drinks)\b/i, cat: "beverages" },
  { match: /\b(frozen|ice-cream)\b/i, cat: "frozen" },
  { match: /\b(breads?|bakery|pastries|bakeries|wraps|rolls)\b/i, cat: "bakery" },
  { match: /\b(fresh-foods|fruits|vegetables|produce|bananas?|apples?|salad)\b/i, cat: "fresh_produce" },
  { match: /\b(cleaners?|detergents?|household|paper-products|laundry|toilet-paper|dishwashing)\b/i, cat: "household" },
  { match: /\b(personal-care|toiletries|hygien|soaps?|shampoos?|toothpaste|deodorant)\b/i, cat: "personal_care" },
];

const DEFAULT_SEARCH_TERMS = [
  "milk",
  "bread",
  "bananas",
  "chicken",
  "rice",
  "pasta",
  "frozen vegetables",
  "juice",
  "toilet paper",
  "shampoo",
];

const WOOLWORTHS_PUBLIC_API_KEY = "KaGOqzzJ3ZTjswc62prswRLXCqJ4oepSqtI2P8iM";
const COLES_PUBLIC_API_KEY = "dd6ae58532d743978508555a59a199ac";

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

function classifyCategory(tags: string[]): GroceryCategory {
  for (const tag of tags) {
    for (const rule of CATEGORY_TAG_RULES) if (rule.match.test(tag)) return rule.cat;
  }
  return "pantry";
}

function logSupplier(name: string, event: string, data: Record<string, unknown> = {}) {
  console.log(`[grocery-supplier] ${JSON.stringify({ supplier: name, event, ...data })}`);
}

function logSupplierError(name: string, event: string, error: unknown, data: Record<string, unknown> = {}) {
  const status = error instanceof SupplierFetchError ? error.status : undefined;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[grocery-supplier] ${JSON.stringify({ supplier: name, event, status, message, ...data })}`);
}

function getSearchTerms(): string[] {
  return (process.env.GROCERY_SUPPLIER_SEARCH_TERMS || DEFAULT_SEARCH_TERMS.join(","))
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean);
}

function cleanString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text || null;
}

function pickString(record: AnyRecord, paths: string[]): string | null {
  for (const path of paths) {
    const value = getPath(record, path);
    const text = cleanString(value);
    if (text) return text;
  }
  return null;
}

function getPath(record: AnyRecord, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as AnyRecord)[key];
  }, record);
}

function isRecord(value: unknown): value is AnyRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function parsePrice(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value.toFixed(2);
  const text = String(value).replace(/,/g, "");
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const num = Number(match[0]);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(2);
}

function findPrice(record: AnyRecord): string | null {
  const direct = [
    "price",
    "currentPrice",
    "cupPrice",
    "salePrice",
    "singlePrice",
    "price.current",
    "price.now",
    "price.value",
    "price.amount",
    "pricing.now",
    "pricing.price",
    "pricing.currentPrice",
    "pricing.current",
    "pricing.price.value",
    "Price",
    "CurrentPrice",
    "ProductsPrice",
  ];
  for (const path of direct) {
    const price = parsePrice(getPath(record, path));
    if (price) return price;
  }
  return null;
}

function collectTags(record: AnyRecord, extra: string[] = []): string[] {
  const out: string[] = [...extra];
  const fields = ["category", "categoryName", "department", "departmentName", "aisle", "aisleName", "shelf", "breadcrumb", "breadcrumbs", "categories", "categories_tags"];
  for (const field of fields) {
    const value = record[field];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") out.push(item);
        else if (item && typeof item === "object") out.push(...Object.values(item).map(String));
      }
    } else if (value && typeof value === "object") {
      out.push(...Object.values(value).map(String));
    } else {
      const text = cleanString(value);
      if (text) out.push(text);
    }
  }
  return out.filter(Boolean);
}

function imageFrom(record: AnyRecord): string | null {
  const direct = pickString(record, ["image", "imageUrl", "image_url", "thumbnail", "thumbnailUrl", "smallImage", "largeImage", "productImage", "image_front_small_url", "image_front_url", "Image", "ImageUrl", "SmallImageFile", "MediumImageFile", "LargeImageFile"]);
  if (direct) return direct;
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      const found = value.find((item) => typeof item === "string" && /^https?:\/\//.test(item));
      if (found) return found;
    }
  }
  return null;
}

function stockFrom(record: AnyRecord): boolean {
  const falseSignals = ["out of stock", "unavailable", "not available", "sold out", "false", "0", "no"];
  const trueSignals = ["in stock", "available", "true", "1", "yes"];
  for (const path of ["inStock", "available", "isAvailable", "isInStock", "stockAvailable", "availability", "stockStatus", "status", "productStatus"]) {
    const value = getPath(record, path);
    if (typeof value === "boolean") return value;
    const text = cleanString(value)?.toLowerCase();
    if (!text) continue;
    if (falseSignals.some((signal) => text.includes(signal))) return false;
    if (trueSignals.some((signal) => text.includes(signal))) return true;
  }
  if (record.outOfStock === true || record.isOutOfStock === true) return false;
  return true;
}

function stableId(name: string, source: string): string {
  return createHash("sha1").update(`${source}:${name}`).digest("hex").slice(0, 20);
}

function normaliseSupplierProduct(record: AnyRecord, supplier: string, tags: string[] = []): SupplierProductInput | null {
  const name = pickString(record, ["name", "productName", "displayName", "title", "product_name", "description", "Description", "Name"]);
  if (!name) return null;
  const id = pickString(record, ["id", "sku", "productId", "product_id", "articleId", "article_id", "code", "barcode", "gtin", "Stockcode", "StockCode", "ProductId", "id_sku", "url"])
    ?? stableId(name, supplier);
  const category = classifyCategory(collectTags(record, tags));
  const price = findPrice(record);
  const unit = pickString(record, ["unit", "size", "packageSize", "package_size", "quantity", "unitOfMeasure", "uom", "cupMeasure", "pricing.cupMeasure", "Quantity", "PackageSize", "CupMeasure", "CupString"]) ?? "1 each";
  const brand = pickString(record, ["brand", "brandName", "manufacturer", "vendor", "Brand", "Manufacturer"]);
  const supplierUrl = pickString(record, ["url", "productUrl", "product_url", "link", "slug", "Url", "ProductUrl", "Slug"]);
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
      if (value.some((item) => isRecord(item) && ("name" in item || "Name" in item || "productName" in item || "displayName" in item || "DisplayName" in item || "description" in item || "Description" in item))) {
        out.push(...value.filter(isRecord));
        return;
      }
      for (const item of value) walk(item, depth + 1);
      return;
    }
    if (!isRecord(value)) return;
    const record = value;
    if (record.name || record.Name || record.productName || record.displayName || record.DisplayName || ((record.description || record.Description) && (record.price || record.Price || record.pricing || record.currentPrice || record.CurrentPrice))) out.push(record);
    for (const [key, child] of Object.entries(record)) {
      if (productKeys.test(key) || typeof child === "object") walk(child, depth + 1);
    }
  };
  walk(body, 0);
  return out;
}

async function fetchJson(supplier: string, url: string, init: RequestInit = {}): Promise<unknown> {
  const requestCount = 1;
  logSupplier(supplier, "request", { url, requestCount });
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
  const contentType = resp.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) {
    const text = await resp.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new SupplierFetchError(supplier, `Expected JSON but received ${contentType || "unknown content type"}`, resp.status);
    }
  }
  return resp.json();
}

async function fetchSearchProducts(params: {
  supplier: string;
  limit: number;
  terms?: string[];
  buildRequest: (term: string, perTermLimit: number) => { url: string; init?: RequestInit; tags?: string[] };
}): Promise<SupplierProductInput[]> {
  const terms = params.terms ?? getSearchTerms();
  const perTermLimit = Math.max(4, Math.ceil(params.limit / Math.max(terms.length, 1)));
  const products: SupplierProductInput[] = [];
  const seen = new Set<string>();
  let requestCount = 0;
  for (const term of terms) {
    if (products.length >= params.limit) break;
    const request = params.buildRequest(term, perTermLimit);
    requestCount++;
    const body = await fetchJson(params.supplier, request.url, request.init);
    for (const record of extractProductRecords(body)) {
      const product = normaliseSupplierProduct(record, params.supplier, [term, ...(request.tags ?? [])]);
      if (!product || seen.has(product.supplierProductId)) continue;
      seen.add(product.supplierProductId);
      products.push(product);
      if (products.length >= params.limit) break;
    }
  }
  logSupplier(params.supplier, "fetch_complete", { requestCount, productCount: products.length });
  return products;
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
    try {
      const body = (await fetchJson(this.name, url)) as { products?: Array<Record<string, unknown>> };
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
      logSupplier(this.name, "fetch_complete", { requestCount: 1, productCount: out.length });
      return out;
    } catch (error) {
      logSupplierError(this.name, "fetch_failed", error);
      throw error;
    }
  }
}

export class WoolworthsAdapter implements GrocerySupplierAdapter {
  readonly name = "woolworths";

  async fetchProducts({ limit }: { limit: number }): Promise<SupplierProductInput[]> {
    if (process.env.WOOLWORTHS_API_KEY) return this.fetchOfficial(limit);
    return this.fetchPublicStorefront(limit);
  }

  private async fetchOfficial(limit: number): Promise<SupplierProductInput[]> {
    const baseUrl = process.env.WOOLWORTHS_API_BASE_URL || "https://apiportal.woolworths.com.au";
    const searchPath = process.env.WOOLWORTHS_API_SEARCH_PATH || "/product/v1/products/search";
    const searchParam = process.env.WOOLWORTHS_API_SEARCH_PARAM || "searchTerm";
    const limitParam = process.env.WOOLWORTHS_API_LIMIT_PARAM || "pageSize";
    const key = process.env.WOOLWORTHS_API_KEY!;
    try {
      return await fetchSearchProducts({
        supplier: this.name,
        limit,
        buildRequest: (term, perTermLimit) => {
          const url = new URL(searchPath, baseUrl);
          url.searchParams.set(searchParam, term);
          url.searchParams.set(limitParam, String(perTermLimit));
          return {
            url: url.toString(),
            tags: [term],
            init: {
              headers: {
                "Ocp-Apim-Subscription-Key": key,
                "X-Api-Key": key,
              },
            },
          };
        },
      });
    } catch (error) {
      logSupplierError(this.name, "official_fetch_failed", error);
      throw error;
    }
  }

  private async fetchPublicStorefront(limit: number): Promise<SupplierProductInput[]> {
    try {
      return await fetchSearchProducts({
        supplier: this.name,
        limit,
        buildRequest: (term, perTermLimit) => ({
          url: "https://www.woolworths.com.au/apis/ui/Search/products",
          tags: [term],
          init: {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Api-Key": WOOLWORTHS_PUBLIC_API_KEY,
              "Request-Source": "MapAble",
            },
            body: JSON.stringify({
              SearchTerm: term,
              PageNumber: 1,
              PageSize: perTermLimit,
              SortType: "TraderRelevance",
              Filters: [],
              Location: `/shop/search/products?searchTerm=${encodeURIComponent(term)}`,
            }),
          },
        }),
      });
    } catch (error) {
      logSupplierError(this.name, "public_fetch_failed", error);
      throw error;
    }
  }
}

export class ColesAdapter implements GrocerySupplierAdapter {
  readonly name = "coles";

  async fetchProducts({ limit }: { limit: number }): Promise<SupplierProductInput[]> {
    const baseUrl = process.env.COLES_API_BASE_URL || "https://apigw.coles.com.au/digital/colesappbff";
    const storeId = process.env.COLES_STORE_ID || "0584";
    try {
      return await fetchSearchProducts({
        supplier: this.name,
        limit,
        buildRequest: (term, perTermLimit) => {
          const url = new URL("/v2/products/search", baseUrl);
          url.searchParams.set("searchTerm", term);
          url.searchParams.set("storeId", storeId);
          url.searchParams.set("start", "0");
          url.searchParams.set("limit", String(perTermLimit));
          return {
            url: url.toString(),
            tags: [term],
            init: { headers: { "X-Api-Key": process.env.COLES_API_KEY || COLES_PUBLIC_API_KEY } },
          };
        },
      });
    } catch (error) {
      logSupplierError(this.name, "fetch_failed", error);
      throw error;
    }
  }
}

export class IgaAdapter implements GrocerySupplierAdapter {
  readonly name = "iga";

  async fetchProducts({ limit }: { limit: number }): Promise<SupplierProductInput[]> {
    const baseUrl = process.env.IGA_API_BASE_URL || "https://www.igashop.com.au";
    const searchPath = process.env.IGA_API_SEARCH_PATH || "/api/products/search";
    const searchParam = process.env.IGA_API_SEARCH_PARAM || "q";
    try {
      return await fetchSearchProducts({
        supplier: this.name,
        limit,
        buildRequest: (term, perTermLimit) => {
          const url = new URL(searchPath, baseUrl);
          url.searchParams.set(searchParam, term);
          url.searchParams.set("limit", String(perTermLimit));
          return { url: url.toString(), tags: [term] };
        },
      });
    } catch (error) {
      logSupplierError(this.name, "fetch_failed", error, { baseUrl, searchPath });
      throw error;
    }
  }
}

export class CsvSupplierAdapter implements GrocerySupplierAdapter {
  readonly name = "csv";

  async fetchProducts({ limit }: { limit: number }): Promise<SupplierProductInput[]> {
    const source = process.env.GROCERY_SUPPLIER_CSV_PATH;
    if (!source) throw new SupplierFetchError(this.name, "GROCERY_SUPPLIER_CSV_PATH must be set to a local path or URL");
    try {
      const text = /^https?:\/\//i.test(source)
        ? await fetchCsvUrl(source)
        : await readFile(source, "utf8");
      const rows = parseCsv(text);
      const products: SupplierProductInput[] = [];
      const seen = new Set<string>();
      for (const row of rows) {
        const mapped = mapCsvRow(row);
        const tags = [mapped.category, mapped.department, mapped.aisle]
          .map((value) => cleanString(value))
          .filter((value): value is string => !!value);
        const product = normaliseSupplierProduct(mapped, this.name, tags);
        if (!product || seen.has(product.supplierProductId)) continue;
        seen.add(product.supplierProductId);
        products.push(product);
        if (products.length >= limit) break;
      }
      logSupplier(this.name, "fetch_complete", { source, rowCount: rows.length, productCount: products.length });
      return products;
    } catch (error) {
      logSupplierError(this.name, "fetch_failed", error, { source });
      throw error;
    }
  }
}

async function fetchCsvUrl(url: string): Promise<string> {
  const resp = await fetch(url, { signal: AbortSignal.timeout(Number(process.env.GROCERY_SUPPLIER_TIMEOUT_MS ?? "12000")) });
  if (!resp.ok) throw new SupplierFetchError("csv", resp.statusText, resp.status);
  return resp.text();
}

function parseCsv(text: string): AnyRecord[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => normaliseHeader(header));
  return rows.slice(1).map((values) => {
    const record: AnyRecord = {};
    headers.forEach((header, index) => {
      if (header) record[header] = values[index]?.trim() ?? "";
    });
    return record;
  });
}

function normaliseHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function firstCsvValue(row: AnyRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = cleanString(row[normaliseHeader(key)]);
    if (value) return value;
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
  return {
    name,
    brand,
    price,
    unit,
    category,
    department: category,
    image,
    imageUrl: image,
    sku,
    url,
    inStock: stock ? !/^(false|0|no|out|out of stock|unavailable)$/i.test(stock.trim()) : true,
  };
}

export class CompositeSupplierAdapter implements GrocerySupplierAdapter {
  readonly name: string;
  selectedProvider: string | null = null;

  constructor(private readonly adapters: GrocerySupplierAdapter[]) {
    this.name = `composite:${adapters.map((adapter) => adapter.name).join("→")}`;
  }

  async fetchProducts(opts: { limit: number }): Promise<SupplierProductInput[]> {
    const failures: string[] = [];
    this.selectedProvider = null;
    for (const adapter of this.adapters) {
      try {
        const products = await adapter.fetchProducts(opts);
        if (products.length > 0) {
          this.selectedProvider = adapter instanceof CompositeSupplierAdapter
            ? adapter.selectedProvider ?? adapter.name
            : adapter.name;
          logSupplier(this.name, "selected_provider", { provider: adapter.name, productCount: products.length });
          return products;
        }
        failures.push(`${adapter.name}: empty result`);
        logSupplier(this.name, "provider_empty", { provider: adapter.name });
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
        logSupplierError(this.name, "provider_failed", error, { provider: adapter.name });
      }
    }
    throw new SupplierFetchError(this.name, `No supplier returned products. ${failures.join("; ")}`);
  }
}

export function isSupplierEnabled(): boolean {
  return process.env.GROCERY_SUPPLIER_DISABLED !== "1";
}

export function getSupplierProvider(): string {
  return (process.env.GROCERY_SUPPLIER_PROVIDER || "openfoodfacts").toLowerCase();
}

export function buildAdapter(provider = getSupplierProvider()): GrocerySupplierAdapter {
  const normalised = provider.trim().toLowerCase();
  switch (normalised) {
    case "openfoodfacts":
      return new OpenFoodFactsAdapter(process.env.GROCERY_SUPPLIER_BASE_URL);
    case "woolworths":
      return new WoolworthsAdapter();
    case "coles":
      return new ColesAdapter();
    case "iga":
      return new IgaAdapter();
    case "csv":
      return new CsvSupplierAdapter();
    case "composite":
    case "firstavailable":
    case "first-available":
      return buildCompositeAdapter();
    default:
      throw new Error(`Unknown grocery supplier provider: ${provider}`);
  }
}

function buildCompositeAdapter(): GrocerySupplierAdapter {
  const chain = (process.env.GROCERY_SUPPLIER_CHAIN || "woolworths,coles,openfoodfacts")
    .split(",")
    .map((provider) => provider.trim().toLowerCase())
    .filter(Boolean)
    .filter((provider) => !["composite", "firstavailable", "first-available"].includes(provider));
  if (chain.length === 0) throw new Error("GROCERY_SUPPLIER_CHAIN must include at least one non-composite provider");
  return new CompositeSupplierAdapter(chain.map((provider) => buildAdapter(provider)));
}

export function getSupplierLimit(): number {
  const raw = Number(process.env.GROCERY_SUPPLIER_LIMIT ?? "60");
  if (!Number.isFinite(raw) || raw <= 0) return 60;
  return Math.min(Math.floor(raw), 100);
}

export interface SyncOptions {
  limit?: number;
  replaceSeed?: boolean;
}

export interface SyncResult {
  provider: string;
  fetched: number;
  upserted: number;
  removedSeed: number;
}

export async function syncGroceryCatalog(opts: SyncOptions = {}): Promise<SyncResult> {
  const { storage } = await import("./storage");
  const adapter = buildAdapter();
  const limit = opts.limit ?? getSupplierLimit();
  const replaceSeed = opts.replaceSeed ?? (process.env.GROCERY_SUPPLIER_REPLACE_SEED !== "0");

  const supplierProducts = await adapter.fetchProducts({ limit });
  if (supplierProducts.length === 0) {
    throw new SupplierFetchError(adapter.name, "Supplier returned no products; existing inventory was left unchanged");
  }
  const producingProvider = adapter instanceof CompositeSupplierAdapter
    ? adapter.selectedProvider ?? adapter.name
    : adapter.name;
  let upserted = 0;
  for (const sp of supplierProducts) {
    await storage.upsertSupplierGroceryProduct(toInsertProduct(sp, producingProvider));
    upserted++;
  }
  let removedSeed = 0;
  if (replaceSeed && upserted > 0) {
    removedSeed = await storage.deleteGroceryProductsBySource("seed");
  }
  logSupplier(adapter.name, "sync_complete", { selectedProvider: producingProvider, fetched: supplierProducts.length, upserted, removedSeed });
  return { provider: producingProvider, fetched: supplierProducts.length, upserted, removedSeed };
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
