/** Client-side offline venue pack manager using IndexedDB. */

const DB_NAME = "mapable-offline-packs";
const DB_VERSION = 1;
const STORE = "venue-packs";

export type OfflineVenuePack = {
  venueId: string;
  venueName: string;
  version: string;
  downloadedAt: string;
  expiresAt: string;
  floorPlanSummaries: unknown;
  textAlternative: unknown;
  statusSnapshotAt?: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "venueId" });
      }
    };
  });
}

export async function saveOfflinePack(pack: OfflineVenuePack): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(pack);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflinePack(venueId: string): Promise<OfflineVenuePack | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(venueId);
    req.onsuccess = () => resolve((req.result as OfflineVenuePack) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function removeOfflinePack(venueId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(venueId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listOfflinePacks(): Promise<OfflineVenuePack[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as OfflineVenuePack[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}
