import { describe, expect, it } from "vitest";

import {
  ACCESSCAST_OFFLINE_STORAGE_KEY_PREFIX,
  compileAccessCastOfflinePack,
  evaluateOfflineAccessCast,
  forecastHarbourPlaceOutlook,
  offlinePackChangedSinceSaved,
  offlinePresentationCopy,
} from "@/lib/accesscast";

describe("AccessCast offline store contract", () => {
  it("exposes encrypted-store key prefix and never claims current", () => {
    expect(ACCESSCAST_OFFLINE_STORAGE_KEY_PREFIX).toMatch(/accesscast\.offline/);

    const result = forecastHarbourPlaceOutlook();
    const pack = compileAccessCastOfflinePack(result, "2026-09-17T06:05:00+10:00");
    expect(pack.generatedAt).toBeTruthy();
    expect(pack.expiresAt).toBeTruthy();
    expect(pack.sourcesNotRefreshed.length).toBeGreaterThan(0);

    const fresh = evaluateOfflineAccessCast(pack, pack.savedAt);
    expect(fresh.expired).toBe(false);
    expect(offlinePresentationCopy(fresh).showAsCurrent).toBe(false);

    const expired = evaluateOfflineAccessCast(pack, "2099-01-01T00:00:00.000Z");
    expect(expired.effectiveState).toBe("stale");
    expect(offlinePackChangedSinceSaved(expired)).toBe(true);
    expect(offlinePresentationCopy(expired).title).toMatch(/expired/i);
  });
});
