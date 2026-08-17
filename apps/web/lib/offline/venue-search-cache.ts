/**
 * IndexedDB cache for public venue accessibility search results.
 * Stores only non-sensitive, previously fetched venue specs for offline viewing.
 */

const DB_NAME = "mapable-venue-search-cache";
const DB_VERSION = 1;
const STORE = "searches";
const LATEST_KEY = "latest";

export type CachedVenueSpec = {
  id: string;
  slug: string;
  name: string;
  category: string;
  suburb: string;
  state: string;
  accessScore: number;
  tier: string;
  confidence: string;
  lastChecked: string;
  source: string;
  topAccessFacts: string[];
  keyBarrier: string | null;
  measurements: { label: string; value: string; note?: string }[];
  doorWidthMm?: number | null;
  stepFreeEntry?: boolean | null;
  accessibleToilet?: boolean | null;
};

export type VenueSearchCacheRecord = {
  key: string;
  query: string;
  cachedAt: string;
  venues: CachedVenueSpec[];
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
  });
}

export async function saveVenueSearchCache(
  record: Omit<VenueSearchCacheRecord, "key"> & { key?: string },
): Promise<void> {
  const db = await openDb();
  const payload: VenueSearchCacheRecord = {
    key: record.key ?? LATEST_KEY,
    query: record.query,
    cachedAt: record.cachedAt,
    venues: record.venues,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(payload);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
  });
}

export async function getVenueSearchCache(
  key: string = LATEST_KEY,
): Promise<VenueSearchCacheRecord | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () =>
      resolve((req.result as VenueSearchCacheRecord | undefined) ?? null);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB read failed"));
  });
}

export async function clearVenueSearchCache(
  key: string = LATEST_KEY,
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB delete failed"));
  });
}
