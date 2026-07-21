/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ACCESSIBILITY_PRESETS,
  ACCESSIBILITY_UI_STORAGE_KEY,
  applyPreset,
  applyPreferencesToDocument,
  areCustomColorsSafe,
  clearPreferencesFromDocument,
  clearPreferencesStorage,
  contrastRatio,
  DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
  describePreferenceChanges,
  hasCustomPreferences,
  loadPreferencesFromStorage,
  mergeUiIntoDigitalPreferences,
  migrateLegacyDigitalPreferences,
  parseAccessibilityUiPreferences,
  preferencesMatchPreset,
  savePreferencesToStorage,
} from "@/lib/accessibility/ui-preferences";
import type { AccessibilityUiPreferences } from "@/types/accessibility-ui";

describe("accessibility UI preferences", () => {
  afterEach(() => {
    clearPreferencesStorage();
    clearPreferencesFromDocument();
    vi.unstubAllGlobals();
  });

  it("exposes safe defaults", () => {
    expect(DEFAULT_ACCESSIBILITY_UI_PREFERENCES.version).toBe(1);
    expect(DEFAULT_ACCESSIBILITY_UI_PREFERENCES.textScale).toBe(100);
    expect(DEFAULT_ACCESSIBILITY_UI_PREFERENCES.reduceMotion).toBe(false);
    expect(hasCustomPreferences(DEFAULT_ACCESSIBILITY_UI_PREFERENCES)).toBe(
      false,
    );
  });

  it("applies every goal-based preset", () => {
    for (const id of Object.keys(ACCESSIBILITY_PRESETS) as Array<
      keyof typeof ACCESSIBILITY_PRESETS
    >) {
      const next = applyPreset(DEFAULT_ACCESSIBILITY_UI_PREFERENCES, id);
      expect(preferencesMatchPreset(next, id)).toBe(true);
      expect(hasCustomPreferences(next)).toBe(true);
    }
  });

  it("allows individual overrides after a preset without reapplying", () => {
    const afterPreset = applyPreset(
      DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
      "clearer-vision",
    );
    const overridden: AccessibilityUiPreferences = {
      ...afterPreset,
      textScale: 150,
    };
    expect(preferencesMatchPreset(overridden, "clearer-vision")).toBe(false);
    expect(overridden.contrastTheme).toBe("high");
  });

  it("describes changed settings after a preset", () => {
    const next = applyPreset(
      DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
      "comfort-mode",
    );
    const changes = describePreferenceChanges(
      DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
      next,
    );
    expect(changes).toContain("Text size");
    expect(changes).toContain("Reduce motion");
  });

  it("ignores corrupted local storage", () => {
    window.localStorage.setItem(ACCESSIBILITY_UI_STORAGE_KEY, "{not-json");
    expect(loadPreferencesFromStorage()).toEqual(
      DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
    );

    window.localStorage.setItem(
      ACCESSIBILITY_UI_STORAGE_KEY,
      JSON.stringify({ version: 1, textScale: 999 }),
    );
    expect(loadPreferencesFromStorage()).toEqual(
      DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
    );
  });

  it("persists and clears valid preferences", () => {
    const prefs = applyPreset(
      DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
      "reading-support",
    );
    savePreferencesToStorage(prefs);
    expect(loadPreferencesFromStorage().fontMode).toBe("readable");
    clearPreferencesStorage();
    expect(loadPreferencesFromStorage()).toEqual(
      DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
    );
  });

  it("migrates legacy digital preferences without deleting them", () => {
    const migrated = migrateLegacyDigitalPreferences({
      largeText: true,
      highContrast: true,
      reducedMotion: true,
      dyslexiaFriendlyMode: true,
      screenReaderUser: true,
      simpleLanguageMode: true,
    });
    expect(migrated.textScale).toBe(125);
    expect(migrated.contrastTheme).toBe("high");
    expect(migrated.reduceMotion).toBe(true);
    expect(migrated.fontMode).toBe("dyslexia-friendly");
    // screenReaderUser must not become a UI toggle.
    expect(Object.keys(migrated)).not.toContain("screenReaderUser");
  });

  it("validates contrast for custom colours", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeGreaterThan(4.5);
    expect(areCustomColorsSafe({ text: "#000000", background: "#FFFFFF" })).toBe(
      true,
    );
    expect(areCustomColorsSafe({ text: "#CCCCCC", background: "#FFFFFF" })).toBe(
      false,
    );
    expect(
      parseAccessibilityUiPreferences({
        ...DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
        customColors: { text: "#CCCCCC", background: "#FFFFFF" },
      })?.customColors,
    ).toBeUndefined();
  });

  it("honours system reduced motion when applying to the document", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    applyPreferencesToDocument({
      ...DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
      reduceMotion: false,
      stopAnimations: false,
    });
    expect(document.documentElement.dataset.a11yMotion).toBe("reduce");
    expect(document.documentElement.dataset.a11yStopAnimations).toBe("true");
  });

  it("never enables animation over a user reduced-motion preference", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    applyPreferencesToDocument({
      ...DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
      reduceMotion: true,
      stopAnimations: false,
    });
    expect(document.documentElement.dataset.a11yMotion).toBe("reduce");
    expect(document.documentElement.dataset.a11yStopAnimations).toBe("true");
  });

  it("merges UI prefs into digital preferences without dropping legacy flags", () => {
    const merged = mergeUiIntoDigitalPreferences(
      {
        screenReaderUser: true,
        voiceControlPreferred: true,
        simpleLanguageMode: true,
      },
      applyPreset(DEFAULT_ACCESSIBILITY_UI_PREFERENCES, "clearer-vision"),
    );
    expect(merged.screenReaderUser).toBe(true);
    expect(merged.voiceControlPreferred).toBe(true);
    expect(merged.simpleLanguageMode).toBe(true);
    expect(merged.largeText).toBe(true);
    expect(merged.highContrast).toBe(true);
    expect(merged.ui?.contrastTheme).toBe("high");
  });
});
