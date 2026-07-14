export type StoredObject = {
  key: string;
  version: string;
  sizeBytes: number;
};

export interface ObjectStorageProvider {
  putObject(input: {
    key: string;
    data: Uint8Array;
    contentType: string;
  }): Promise<StoredObject>;
  getObject(input: { key: string; version?: string }): Promise<Uint8Array>;
  createSignedUrl(input: {
    key: string;
    expiresInSeconds: number;
  }): Promise<string>;
  deleteObject(input: { key: string }): Promise<void>;
}

export interface QueueProvider {
  publish<T>(topic: string, payload: T): Promise<{ messageId: string }>;
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Recording provider for tests and local simulation. It deliberately has no
 * network path and never sends an external message.
 */
export class RecordingQueueProvider implements QueueProvider {
  readonly messages: Array<{ id: string; topic: string; payload: unknown }> =
    [];

  async publish<T>(topic: string, payload: T) {
    const messageId = crypto.randomUUID();
    this.messages.push({ id: messageId, topic, payload });
    return { messageId };
  }
}

export class MemoryCacheProvider implements CacheProvider {
  private readonly values = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    return (this.values.get(key) as T | undefined) ?? null;
  }
  async set<T>(key: string, value: T): Promise<void> {
    this.values.set(key, value);
  }
  async delete(key: string): Promise<void> {
    this.values.delete(key);
  }
}

/** HTTP webhook queue — publishes to QUEUE_WEBHOOK_URL or records when unset. */
export class ManagedQueueProvider implements QueueProvider {
  private readonly webhookUrl: string | undefined;
  readonly recordedMessages: Array<{
    id: string;
    topic: string;
    payload: unknown;
  }> = [];

  constructor(webhookUrl = process.env.QUEUE_WEBHOOK_URL?.trim()) {
    this.webhookUrl = webhookUrl || undefined;
  }

  async publish<T>(topic: string, payload: T) {
    const messageId = crypto.randomUUID();
    const envelope = { messageId, topic, payload, publishedAt: new Date().toISOString() };

    if (this.webhookUrl) {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envelope),
      });
      if (!response.ok) {
        throw new Error(`QUEUE_WEBHOOK_FAILED:${response.status}`);
      }
    } else {
      this.recordedMessages.push({ id: messageId, topic, payload });
    }

    return { messageId };
  }
}

/** Upstash Redis REST — no native Redis client required. */
export class RedisCacheProvider implements CacheProvider {
  private readonly restUrl: string;
  private readonly token: string;

  constructor(
    restUrl = process.env.UPSTASH_REDIS_REST_URL?.trim(),
    token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  ) {
    if (!restUrl || !token) {
      throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required");
    }
    this.restUrl = restUrl.replace(/\/$/, "");
    this.token = token;
  }

  private async command<T>(parts: string[]): Promise<T> {
    const path = parts.map(encodeURIComponent).join("/");
    const response = await fetch(`${this.restUrl}/${path}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!response.ok) {
      throw new Error(`UPSTASH_REDIS_FAILED:${response.status}`);
    }
    const body = (await response.json()) as { result?: T };
    return body.result as T;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.command<string | null>(["get", key]);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const encoded = JSON.stringify(value);
    if (ttlSeconds != null && ttlSeconds > 0) {
      await this.command(["set", key, encoded, "EX", String(ttlSeconds)]);
    } else {
      await this.command(["set", key, encoded]);
    }
  }

  async delete(key: string): Promise<void> {
    await this.command(["del", key]);
  }
}

/** Supabase Storage via existing @supabase/supabase-js admin client. */
export class SupabaseStorageProvider implements ObjectStorageProvider {
  private readonly bucket: string;

  constructor(bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() ?? "careos") {
    if (!bucket) throw new Error("SUPABASE_STORAGE_BUCKET is required");
    this.bucket = bucket;
  }

  private async client() {
    const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
    return getSupabaseAdmin();
  }

  async putObject(input: {
    key: string;
    data: Uint8Array;
    contentType: string;
  }): Promise<StoredObject> {
    const supabase = await this.client();
    const { error } = await supabase.storage
      .from(this.bucket)
      .upload(input.key, input.data, {
        contentType: input.contentType,
        upsert: true,
      });
    if (error) throw new Error(error.message);
    return {
      key: input.key,
      version: "latest",
      sizeBytes: input.data.byteLength,
    };
  }

  async getObject(input: { key: string }): Promise<Uint8Array> {
    const supabase = await this.client();
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .download(input.key);
    if (error || !data) throw new Error(error?.message ?? "OBJECT_NOT_FOUND");
    return new Uint8Array(await data.arrayBuffer());
  }

  async createSignedUrl(input: {
    key: string;
    expiresInSeconds: number;
  }): Promise<string> {
    const supabase = await this.client();
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .createSignedUrl(input.key, input.expiresInSeconds);
    if (error || !data?.signedUrl) {
      throw new Error(error?.message ?? "SIGNED_URL_FAILED");
    }
    return data.signedUrl;
  }

  async deleteObject(input: { key: string }): Promise<void> {
    const supabase = await this.client();
    const { error } = await supabase.storage.from(this.bucket).remove([input.key]);
    if (error) throw new Error(error.message);
  }
}

/**
 * Minimal S3-compatible adapter using fetch to a configured REST gateway
 * (e.g. R2/MinIO proxy). Avoids adding @aws-sdk as a direct dependency.
 */
export class S3ObjectStorageProvider implements ObjectStorageProvider {
  private readonly baseUrl: string;
  private readonly authHeader: string | undefined;

  constructor(
    baseUrl = process.env.S3_REST_BASE_URL?.trim(),
    authHeader = process.env.S3_REST_AUTH_HEADER?.trim(),
  ) {
    if (!baseUrl) throw new Error("S3_REST_BASE_URL is required");
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.authHeader = authHeader;
  }

  private headers(contentType?: string): HeadersInit {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (this.authHeader) headers.Authorization = this.authHeader;
    return headers;
  }

  async putObject(input: {
    key: string;
    data: Uint8Array;
    contentType: string;
  }): Promise<StoredObject> {
    const response = await fetch(
      `${this.baseUrl}/objects/${encodeURIComponent(input.key)}`,
      {
        method: "PUT",
        headers: this.headers(input.contentType),
        body: input.data,
      },
    );
    if (!response.ok) throw new Error(`S3_PUT_FAILED:${response.status}`);
    const version =
      response.headers.get("x-object-version") ??
      response.headers.get("etag") ??
      "latest";
    return {
      key: input.key,
      version,
      sizeBytes: input.data.byteLength,
    };
  }

  async getObject(input: { key: string }): Promise<Uint8Array> {
    const response = await fetch(
      `${this.baseUrl}/objects/${encodeURIComponent(input.key)}`,
      { headers: this.headers() },
    );
    if (!response.ok) throw new Error(`S3_GET_FAILED:${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  }

  async createSignedUrl(input: {
    key: string;
    expiresInSeconds: number;
  }): Promise<string> {
    const response = await fetch(`${this.baseUrl}/signed-url`, {
      method: "POST",
      headers: { ...this.headers("application/json") },
      body: JSON.stringify({
        key: input.key,
        expiresInSeconds: input.expiresInSeconds,
      }),
    });
    if (!response.ok) throw new Error(`S3_SIGNED_URL_FAILED:${response.status}`);
    const body = (await response.json()) as { url?: string };
    if (!body.url) throw new Error("S3_SIGNED_URL_MISSING");
    return body.url;
  }

  async deleteObject(input: { key: string }): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/objects/${encodeURIComponent(input.key)}`,
      { method: "DELETE", headers: this.headers() },
    );
    if (!response.ok) throw new Error(`S3_DELETE_FAILED:${response.status}`);
  }
}

export function createObjectStorageProvider(
  environment: Record<string, string | undefined> = process.env,
): ObjectStorageProvider {
  const provider = environment.CLOUD_STORAGE_PROVIDER ?? "recording";
  switch (provider) {
    case "recording":
      throw new Error("Recording storage provider is not valid for production use");
    case "supabase":
      return new SupabaseStorageProvider(environment.SUPABASE_STORAGE_BUCKET);
    case "s3":
      return new S3ObjectStorageProvider(
        environment.S3_REST_BASE_URL,
        environment.S3_REST_AUTH_HEADER,
      );
    default: {
      const exhaustive: never = provider as never;
      return exhaustive;
    }
  }
}

export function createCacheProvider(
  environment: Record<string, string | undefined> = process.env,
): CacheProvider {
  const provider = environment.CLOUD_CACHE_PROVIDER ?? "memory";
  switch (provider) {
    case "memory":
      return new MemoryCacheProvider();
    case "redis":
      return new RedisCacheProvider(
        environment.UPSTASH_REDIS_REST_URL,
        environment.UPSTASH_REDIS_REST_TOKEN,
      );
    default: {
      const exhaustive: never = provider as never;
      return exhaustive;
    }
  }
}

export function createQueueProvider(
  environment: Record<string, string | undefined> = process.env,
): QueueProvider {
  const provider = environment.CLOUD_QUEUE_PROVIDER ?? "recording";
  switch (provider) {
    case "recording":
      return new RecordingQueueProvider();
    case "managed":
      return new ManagedQueueProvider(environment.QUEUE_WEBHOOK_URL);
    default: {
      const exhaustive: never = provider as never;
      return exhaustive;
    }
  }
}

/** Dev/test helpers — explicit non-production factories. */
export function createRecordingQueueProvider(): RecordingQueueProvider {
  return new RecordingQueueProvider();
}

export function createMemoryCacheProvider(): MemoryCacheProvider {
  return new MemoryCacheProvider();
}
