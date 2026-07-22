import { afterEach, describe, expect, it } from "vitest";

import { isFirstPartyAccessibilityPanelEnabled } from "@/lib/accessibility/feature-flags";

describe("first-party accessibility panel flag", () => {
  const original = process.env.NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL;
    } else {
      process.env.NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL = original;
    }
  });

  it("defaults false (AccessiBe path remains)", () => {
    delete process.env.NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL;
    expect(isFirstPartyAccessibilityPanelEnabled()).toBe(false);
  });

  it("enables only on exact string true", () => {
    process.env.NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL = "true";
    expect(isFirstPartyAccessibilityPanelEnabled()).toBe(true);
    process.env.NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL = "1";
    expect(isFirstPartyAccessibilityPanelEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL = "TRUE";
    expect(isFirstPartyAccessibilityPanelEnabled()).toBe(false);
  });
});
