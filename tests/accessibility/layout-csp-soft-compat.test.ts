import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { isFirstPartyAccessibilityPanelEnabled } from "@/lib/accessibility/feature-flags";

describe("first-party panel layout CSP soft-compat", () => {
  it("defaults panel flag off", () => {
    const previous = process.env.NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL;
    delete process.env.NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL;
    expect(isFirstPartyAccessibilityPanelEnabled()).toBe(false);
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL;
    } else {
      process.env.NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL = previous;
    }
  });

  it("layout mutex and optional nonce for combined #388 CSP enforce", () => {
    const layout = readFileSync(
      path.join(process.cwd(), "app/layout.tsx"),
      "utf8",
    );
    expect(layout).toMatch(/firstPartyA11yPanel \? null : <AccessiBeWidget/);
    expect(layout).toMatch(/nonce=\{scriptNonce\}/);

    // Standalone #389 uses resolveOptionalCspNonce; after merge with #388 the
    // layout adopts resolveScriptNonce from csp-preview-enforce. Both gate
    // headers() so static caching remains available when CSP enforce is off.
    const hasSoftCompat = /resolveOptionalCspNonce/.test(layout);
    const hasMergedCspHelper = /resolveScriptNonce/.test(layout);
    expect(hasSoftCompat || hasMergedCspHelper).toBe(true);

    if (hasSoftCompat) {
      expect(layout).toMatch(/MAPABLE_CSP_ENFORCE_PREVIEW/);
      expect(layout).toMatch(
        /MAPABLE_CSP_ENFORCE_PREVIEW !== "true"\) return undefined/,
      );
    } else {
      expect(layout).toMatch(/isCspPreviewEnforceEnabled/);
    }
  });
});
