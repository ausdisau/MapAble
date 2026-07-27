import { File } from "@google-cloud/storage";
import type { Readable } from "stream";
import { objectStorageClient, signObjectURL } from "./client";
import {
  BucketConfig,
  BucketReadOnlyError,
  MERGED_DEFAULT_ORDER,
  getBucketConfig,
} from "./buckets";

// AssetStore — a small, typed multi-bucket asset abstraction.
//
// Callers address objects by a *logical* bucket name (see buckets.ts) plus a
// key. Read/write/list/sign operations work against any registered bucket, and
// the merged-view helpers (findFirst / listMerged) treat all registered buckets
// as one logical asset surface so callers don't need to know which bucket a file
// lives in. Default merged search order is `assets` then `default`, so newly
// added assets shadow defaults.
//
// Errors are explicit — unknown bucket names throw UnknownBucketError (from
// getBucketConfig) and writes to read-only buckets throw BucketReadOnlyError.

export interface AssetObject {
  key: string;
  size: number;
  contentType?: string;
  updatedAt?: string;
}

export interface AssetListResult {
  objects: AssetObject[];
  nextPageToken?: string;
}

export interface MergedAssetObject extends AssetObject {
  bucket: string;
}

export interface FindFirstResult {
  bucket: string;
  key: string;
  file: File;
}

export interface ListOptions {
  recursive?: boolean;
  limit?: number;
  pageToken?: string;
}

export interface PutOptions {
  contentType?: string;
  cacheControl?: string;
}

function toAssetObject(file: File): AssetObject {
  const m = file.metadata || {};
  return {
    key: file.name,
    size: typeof m.size === "string" ? parseInt(m.size, 10) : Number(m.size || 0),
    contentType: m.contentType,
    updatedAt: m.updated,
  };
}

export class AssetStore {
  private config(bucket: string): BucketConfig {
    return getBucketConfig(bucket);
  }

  private assertWritable(bucket: string): BucketConfig {
    const cfg = this.config(bucket);
    if (cfg.readOnly) {
      throw new BucketReadOnlyError(bucket);
    }
    return cfg;
  }

  /** Resolves the underlying GCS File handle for a logical bucket + key. */
  file(bucket: string, key: string): File {
    const cfg = this.config(bucket);
    return objectStorageClient.bucket(cfg.bucketId).file(key);
  }

  /** Lists objects in a bucket, optionally under a prefix, with pagination. */
  async list(bucket: string, prefix?: string, opts: ListOptions = {}): Promise<AssetListResult> {
    const cfg = this.config(bucket);
    const [files, , apiResponse] = await objectStorageClient
      .bucket(cfg.bucketId)
      .getFiles({
        prefix: prefix || undefined,
        autoPaginate: false,
        maxResults: opts.limit,
        pageToken: opts.pageToken,
        // When not recursive, collapse "directories" using a delimiter.
        delimiter: opts.recursive === false ? "/" : undefined,
      } as any);
    return {
      objects: files.map(toAssetObject),
      nextPageToken: (apiResponse as any)?.nextPageToken,
    };
  }

  /** Returns true if the object exists. */
  async exists(bucket: string, key: string): Promise<boolean> {
    const [exists] = await this.file(bucket, key).exists();
    return exists;
  }

  /** Returns object metadata, or null if it does not exist. */
  async head(bucket: string, key: string): Promise<AssetObject | null> {
    const file = this.file(bucket, key);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [metadata] = await file.getMetadata();
    file.metadata = metadata;
    return toAssetObject(file);
  }

  /** Returns a readable stream for the object's contents. */
  read(bucket: string, key: string): Readable {
    return this.file(bucket, key).createReadStream();
  }

  /** Returns a short-lived signed GET URL. */
  async getSignedReadUrl(bucket: string, key: string, ttlSec = 900): Promise<string> {
    const cfg = this.config(bucket);
    return signObjectURL({ bucketName: cfg.bucketId, objectName: key, method: "GET", ttlSec });
  }

  /** Returns a short-lived signed PUT URL. Throws on read-only buckets. */
  async getSignedUploadUrl(bucket: string, key: string, ttlSec = 900): Promise<string> {
    const cfg = this.assertWritable(bucket);
    return signObjectURL({ bucketName: cfg.bucketId, objectName: key, method: "PUT", ttlSec });
  }

  /** Streams data into an object. Throws on read-only buckets. */
  async putStream(bucket: string, key: string, stream: Readable, opts: PutOptions = {}): Promise<void> {
    this.assertWritable(bucket);
    const file = this.file(bucket, key);
    await new Promise<void>((resolve, reject) => {
      const write = file.createWriteStream({
        resumable: false,
        contentType: opts.contentType,
        metadata: opts.cacheControl ? { cacheControl: opts.cacheControl } : undefined,
      });
      stream.on("error", reject);
      write.on("error", reject);
      write.on("finish", resolve);
      stream.pipe(write);
    });
  }

  /** Deletes an object. Throws on read-only buckets. */
  async delete(bucket: string, key: string): Promise<void> {
    this.assertWritable(bucket);
    await this.file(bucket, key).delete();
  }

  /**
   * Searches buckets in priority order for the first bucket that contains `key`.
   * Returns the source bucket, key and File handle, or null if none has it.
   */
  async findFirst(key: string, opts: { buckets?: string[] } = {}): Promise<FindFirstResult | null> {
    const order = opts.buckets ?? MERGED_DEFAULT_ORDER;
    for (const bucket of order) {
      const file = this.file(bucket, key);
      const [exists] = await file.exists();
      if (exists) {
        return { bucket, key, file };
      }
    }
    return null;
  }

  /**
   * Lists objects across buckets in priority order as one merged surface. Each
   * entry is tagged with its source bucket; keys are de-duplicated with the
   * first bucket in the order winning (so `assets` shadows `default`).
   */
  async listMerged(prefix: string, opts: { buckets?: string[] } = {}): Promise<MergedAssetObject[]> {
    const order = opts.buckets ?? MERGED_DEFAULT_ORDER;
    const seen = new Set<string>();
    const merged: MergedAssetObject[] = [];
    for (const bucket of order) {
      const { objects } = await this.list(bucket, prefix, { recursive: true });
      for (const obj of objects) {
        if (seen.has(obj.key)) continue;
        seen.add(obj.key);
        merged.push({ ...obj, bucket });
      }
    }
    return merged;
  }

  /** Reads and JSON-parses an object (used by seed/import code for GeoJSON). */
  async readJson<T = unknown>(bucket: string, key: string): Promise<T> {
    const text = await this.readText(bucket, key);
    return JSON.parse(text) as T;
  }

  /** Reads an object as UTF-8 text (used for KML and other text formats). */
  async readText(bucket: string, key: string): Promise<string> {
    const [buf] = await this.file(bucket, key).download();
    return buf.toString("utf-8");
  }
}

// Shared singleton — callers should import this rather than constructing their own.
export const assetStore = new AssetStore();

// Module-level convenience helpers for common asset types so callers (e.g.
// seed/import code) don't have to reach into the AssetStore instance directly.

/** Reads and JSON-parses an object (used by seed/import code for GeoJSON). */
export function readJson<T = unknown>(bucket: string, key: string): Promise<T> {
  return assetStore.readJson<T>(bucket, key);
}

/** Reads an object as UTF-8 text (used for KML and other text formats). */
export function readText(bucket: string, key: string): Promise<string> {
  return assetStore.readText(bucket, key);
}
