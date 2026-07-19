/**
 * Mobile contract for Companion offline AccessCast Visit Pack snapshots.
 * Aligns with lib/accesscast/offline-store-contract.ts.
 * No plain AsyncStorage — Companion must encrypt at rest.
 */

export type AccessCastOfflineMobileSnapshot = {
  schemaVersion: "accesscast-offline-v1";
  packId: string;
  forecastId: string;
  generatedAt: string;
  expiresAt: string;
  savedAt: string;
  journeyLabel: string;
  stateAtSave: string;
  sourcesNotRefreshed: string[];
  offlineClaim: "saved_snapshot_only";
  /** Redacted notification / lock-screen text */
  lockScreenLabel: "Access outlook saved";
  limitations: string[];
};

export type AccessCastOfflineMobileEvaluation = {
  evaluatedAt: string;
  effectiveState: string;
  changedSinceSaved: boolean;
  expired: boolean;
  showAsCurrent: false;
  reasons: string[];
};
