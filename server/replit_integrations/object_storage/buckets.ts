// Bucket registry — the single source of truth for the app's object-storage
// buckets. Each entry maps a stable *logical* name (used everywhere in code) to
// an underlying object-storage bucket id, plus optional metadata.
//
// How to register a new bucket:
//   1. Add an entry to BUILTIN_BUCKETS below with a unique logical `name`, the
//      underlying `bucketId`, whether it is `readOnly`, and (optionally) a
//      `publicPrefix` for content that is served publicly.
//   2. That's it — the AssetStore, the /assets HTTP surface and the merged-view
//      helpers all pick it up automatically.
//
// Overriding without code changes:
//   - ASSETS_BUCKET_ID   — overrides the underlying id of the `assets` bucket.
//   - ASSET_BUCKETS      — a full registry override/extension. Comma-separated
//                          entries, each `name:bucketId[:ro|rw[:publicPrefix]]`.
//                          e.g. "assets:my-bucket-id:rw:public,archive:old-id:ro"
//                          Entries merge over the built-ins by logical name.
//
// Merged-view lookup order (see AssetStore.findFirst / listMerged) defaults to
// `assets` then `default`, so newly added assets shadow the defaults.

export interface BucketConfig {
  /** Stable logical id used by callers, e.g. "default" or "assets". */
  name: string;
  /** Underlying object-storage bucket id. */
  bucketId: string;
  /**
   * Optional path prefix for publicly served content within the bucket. When
   * set, the public `GET /assets/:bucket/*` route only serves keys under this
   * prefix so private objects (e.g. PRIVATE_OBJECT_DIR content) are never
   * exposed. When unset, every key in the bucket is publicly servable.
   */
  publicPrefix?: string;
  /** When true, all write paths (put/delete/signed-upload) are rejected. */
  readOnly: boolean;
  /**
   * When true, the bucket is never served over the public `/assets/:bucket/*`
   * route (the route returns 403). Listing via the staff-gated API still works.
   */
  privateOnly?: boolean;
}

// The two known buckets, pre-registered. `default` is the existing bucket that
// PUBLIC_OBJECT_SEARCH_PATHS / PRIVATE_OBJECT_DIR point at and that the upload +
// ACL flows use. `assets` is the project default bucket for app-managed assets.
const DEFAULT_BUCKET_ID =
  process.env.DEFAULT_BUCKET_ID ||
  "replit-objstore-f974be9b-d8e8-48b3-99db-cb41e9ac325e";
const ASSETS_BUCKET_ID =
  process.env.ASSETS_BUCKET_ID ||
  "replit-objstore-23684864-b650-42b0-b4fb-f420ba4db463";

const BUILTIN_BUCKETS: BucketConfig[] = [
  { name: "default", bucketId: DEFAULT_BUCKET_ID, publicPrefix: "public", readOnly: false },
  { name: "assets", bucketId: ASSETS_BUCKET_ID, publicPrefix: "public", readOnly: false },
];

// Default search order for the merged-view helpers: assets shadow defaults.
export const MERGED_DEFAULT_ORDER = ["assets", "default"];

export class UnknownBucketError extends Error {
  constructor(name: string) {
    super(`Unknown bucket: ${name}`);
    this.name = "UnknownBucketError";
    Object.setPrototypeOf(this, UnknownBucketError.prototype);
  }
}

export class BucketReadOnlyError extends Error {
  constructor(name: string) {
    super(`Bucket is read-only: ${name}`);
    this.name = "BucketReadOnlyError";
    Object.setPrototypeOf(this, BucketReadOnlyError.prototype);
  }
}

// A parsed override entry. Only fields the operator actually specified are
// present, so merging over a built-in never clears a security-sensitive field
// (e.g. `publicPrefix`) that the override left out.
type BucketOverride = Partial<BucketConfig> & { name: string; bucketId: string };

// Parses the optional ASSET_BUCKETS override into partial config entries.
// Format per comma-separated entry: `name:bucketId[:mode[:publicPrefix]]`, where
// `mode` is a "+"-separated set of flags, e.g. "ro", "private", "ro+private".
function parseAssetBucketsEnv(raw: string): BucketOverride[] {
  const out: BucketOverride[] = [];
  for (const entry of raw.split(",").map((e) => e.trim()).filter(Boolean)) {
    const parts = entry.split(":").map((p) => p.trim());
    const [name, bucketId] = parts;
    if (!name || !bucketId) continue;
    const cfg: BucketOverride = { name, bucketId };
    // Only set flags when the mode segment was actually provided.
    if (parts.length > 2 && parts[2] !== "") {
      const modes = new Set(parts[2].split("+").map((m) => m.trim()).filter(Boolean));
      cfg.readOnly = modes.has("ro");
      cfg.privateOnly = modes.has("private");
    }
    // Only set publicPrefix when the segment was actually provided.
    if (parts.length > 3 && parts[3] !== "") {
      cfg.publicPrefix = parts[3];
    }
    out.push(cfg);
  }
  return out;
}

// Builds the effective registry: built-ins merged with any ASSET_BUCKETS
// overrides (matched by logical name; overrides win). Computed once at load.
function buildRegistry(): Map<string, BucketConfig> {
  const registry = new Map<string, BucketConfig>();
  for (const cfg of BUILTIN_BUCKETS) {
    registry.set(cfg.name, cfg);
  }
  const override = process.env.ASSET_BUCKETS;
  if (override) {
    for (const cfg of parseAssetBucketsEnv(override)) {
      const existing = registry.get(cfg.name);
      // cfg only carries explicitly-provided fields, so spreading it over an
      // existing built-in never clears an omitted field (e.g. publicPrefix).
      // Brand-new buckets get a readOnly default of false.
      registry.set(
        cfg.name,
        existing ? { ...existing, ...cfg } : { readOnly: false, ...cfg },
      );
    }
  }
  return registry;
}

const REGISTRY = buildRegistry();

/** Returns the config for a logical bucket name, or throws UnknownBucketError. */
export function getBucketConfig(name: string): BucketConfig {
  const cfg = REGISTRY.get(name);
  if (!cfg) {
    throw new UnknownBucketError(name);
  }
  return cfg;
}

/** Returns true if a logical bucket name is registered. */
export function isKnownBucket(name: string): boolean {
  return REGISTRY.has(name);
}

/** Lists all registered bucket configs. */
export function listBucketConfigs(): BucketConfig[] {
  return Array.from(REGISTRY.values());
}

/** The logical name of the bucket backing the legacy upload + ACL flows. */
export const DEFAULT_BUCKET_NAME = "default";
