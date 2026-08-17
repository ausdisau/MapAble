/**
 * Secure local storage contract for Companion offline AccessCast / Visit Pack.
 * Implementation lives in the Companion app (encrypted store). This module defines
 * the projection boundary only — no plain AsyncStorage for packs.
 */

import type { AccessCastOfflineEvaluation, AccessCastOfflinePack } from "./types";

export const ACCESSCAST_OFFLINE_STORAGE_KEY_PREFIX = "mapable.accesscast.offline.v1";

export type AccessCastOfflineStoreRecord = {
  /** Opaque device-bound key id — never a participant home coordinate. */
  recordId: string;
  /** Ciphertext payload produced by Companion encrypted store. */
  ciphertext: string;
  /** Algorithm identifier for the Companion encryptor. */
  algorithm: "aes-256-gcm" | "platform-secure-store";
  savedAt: string;
  expiresAt: string;
  forecastId: string;
  journeyLabel: string;
  /** Redacted lock-screen safe label. */
  lockScreenLabel: "Access outlook saved";
};

export type AccessCastOfflineStorePort = {
  save(pack: AccessCastOfflinePack): Promise<AccessCastOfflineStoreRecord>;
  load(recordId: string): Promise<AccessCastOfflinePack | null>;
  list(): Promise<AccessCastOfflineStoreRecord[]>;
  remove(recordId: string): Promise<void>;
  /** Evaluate without claiming the snapshot is current. */
  evaluate(recordId: string, at: string): Promise<AccessCastOfflineEvaluation | null>;
};

export function offlinePackChangedSinceSaved(
  evaluation: AccessCastOfflineEvaluation,
): boolean {
  return evaluation.changedSinceSaved || evaluation.expired;
}

export function offlinePresentationCopy(evaluation: AccessCastOfflineEvaluation): {
  title: string;
  body: string;
  showAsCurrent: false;
} {
  return {
    title: evaluation.expired ? "Saved Access Outlook (expired)" : "Saved Access Outlook (offline)",
    body: evaluation.reasons.join(" "),
    showAsCurrent: false,
  };
}
