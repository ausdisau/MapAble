import {
  AURA_STOPPED_KEY,
  getEncryptedStore,
} from "../storage/encrypted-store";

let stopped = false;

/** Immediately stop AURA proposals on this device. */
export function stopAura(): void {
  stopped = true;
  void getEncryptedStore().setItem(AURA_STOPPED_KEY, "1");
}

export function isAuraStopped(): boolean {
  return stopped;
}

export function __resetStopAuraForTests(): void {
  stopped = false;
}
