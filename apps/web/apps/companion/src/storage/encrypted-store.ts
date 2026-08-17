/**
 * Encrypted local storage boundary for Companion.
 * Production builds must use expo-secure-store / SQLCipher — never plain AsyncStorage.
 */

export type EncryptedStore = {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  deleteItem(key: string): Promise<void>;
};

const memory = new Map<string, string>();

/** Test / Node fallback. Native runtime swaps in SecureStore. */
export const memoryEncryptedStore: EncryptedStore = {
  async setItem(key, value) {
    memory.set(key, value);
  },
  async getItem(key) {
    return memory.get(key) ?? null;
  },
  async deleteItem(key) {
    memory.delete(key);
  },
};

let activeStore: EncryptedStore = memoryEncryptedStore;

export function setEncryptedStore(store: EncryptedStore): void {
  activeStore = store;
}

export function getEncryptedStore(): EncryptedStore {
  return activeStore;
}

export const VISIT_PACK_KEY = "companion.visit_pack.v1";
export const AURA_STOPPED_KEY = "companion.aura.stopped";

export function __resetCompanionMemoryStoreForTests(): void {
  memory.clear();
  activeStore = memoryEncryptedStore;
}
