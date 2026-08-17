import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetCompanionMemoryStoreForTests,
  getEncryptedStore,
  VISIT_PACK_KEY,
} from "../../apps/companion/src/storage/encrypted-store";
import {
  clearVisitPackLocal,
  loadVisitPackLocal,
  saveVisitPackLocal,
} from "../../apps/companion/src/visit-pack/local-store";
import {
  __resetStopAuraForTests,
  isAuraStopped,
  stopAura,
} from "../../apps/companion/src/aura/stop-aura";

describe("Companion encrypted local Visit Pack", () => {
  beforeEach(() => {
    __resetCompanionMemoryStoreForTests();
    __resetStopAuraForTests();
  });

  it("stores Visit Pack only via encrypted store boundary", async () => {
    await saveVisitPackLocal({
      packId: "pack-1",
      passportVersion: 1,
      expiresAt: "2026-07-18T00:00:00.000Z",
      instructions: [],
    });
    const raw = await getEncryptedStore().getItem(VISIT_PACK_KEY);
    expect(raw).toContain("pack-1");
    const loaded = await loadVisitPackLocal();
    expect(loaded?.packId).toBe("pack-1");
    await clearVisitPackLocal();
    expect(await loadVisitPackLocal()).toBeNull();
  });

  it("stops AURA on device", () => {
    expect(isAuraStopped()).toBe(false);
    stopAura();
    expect(isAuraStopped()).toBe(true);
  });
});
