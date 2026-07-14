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
  readonly messages: Array<{ id: string; topic: string; payload: unknown }> = [];

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
