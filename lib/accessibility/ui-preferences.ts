import { z } from "zod";

import type {
  AccessibilityCustomColors,
  AccessibilityPresetId,
  AccessibilityUiPreferences,
  LegacyDigitalPreferences,
} from "@/types/accessibility-ui";

export const ACCESSIBILITY_UI_STORAGE_KEY = "mapable:accessibility-ui:v1";

export const DEFAULT_ACCESSIBILITY_UI_PREFERENCES: AccessibilityUiPreferences = {
  version: 1,
  textScale: 100,
  fontMode: "default",
  lineHeight: "default",
  letterSpacing: "default",
  contentAlignment: "default",
  contrastTheme: "default",
  saturation: "default",
  reduceMotion: false,
  stopAnimations: false,
  disableSmoothScrolling: false,
  reduceDecorativeImages: false,
  reduceClutter: false,
  readingMode: false,
  readingGuide: false,
  readingMask: false,
  highlightHeadings: false,
  highlightLinks: false,
  highlightFocus: false,
  highlightHover: false,
  textMagnifier: false,
  cursorMode: "default",
  muteAutomaticSounds: false,
};

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Expected a #RRGGBB colour");

export const accessibilityUiPreferencesSchema = z.object({
  version: z.literal(1),
  textScale: z.union([
    z.literal(100),
    z.literal(112.5),
    z.literal(125),
    z.literal(150),
    z.literal(200),
  ]),
  fontMode: z.enum(["default", "readable", "dyslexia-friendly"]),
  lineHeight: z.enum(["default", "relaxed", "extra-relaxed"]),
  letterSpacing: z.enum(["default", "increased", "extra-increased"]),
  contentAlignment: z.enum(["default", "left", "center", "right"]),
  contrastTheme: z.enum(["default", "light", "dark", "high"]),
  saturation: z.enum(["default", "low", "high", "monochrome"]),
  reduceMotion: z.boolean(),
  stopAnimations: z.boolean(),
  disableSmoothScrolling: z.boolean(),
  reduceDecorativeImages: z.boolean(),
  reduceClutter: z.boolean(),
  readingMode: z.boolean(),
  readingGuide: z.boolean(),
  readingMask: z.boolean(),
  highlightHeadings: z.boolean(),
  highlightLinks: z.boolean(),
  highlightFocus: z.boolean(),
  highlightHover: z.boolean(),
  textMagnifier: z.boolean(),
  cursorMode: z.enum(["default", "large-dark", "large-light"]),
  muteAutomaticSounds: z.boolean(),
  customColors: z
    .object({
      text: hexColorSchema.optional(),
      heading: hexColorSchema.optional(),
      background: hexColorSchema.optional(),
    })
    .optional(),
});

export const ACCESSIBILITY_PRESETS: Record<
  AccessibilityPresetId,
  {
    id: AccessibilityPresetId;
    label: string;
    description: string;
    preferences: Partial<AccessibilityUiPreferences>;
  }
> = {
  "reduce-motion": {
    id: "reduce-motion",
    label: "Reduce motion and flashing",
    description: "Stops decorative motion, smooth scrolling and flashing effects.",
    preferences: {
      reduceMotion: true,
      stopAnimations: true,
      disableSmoothScrolling: true,
      saturation: "default",
    },
  },
  "clearer-vision": {
    id: "clearer-vision",
    label: "Clearer vision",
    description: "Larger text, stronger focus, high contrast, underlined links.",
    preferences: {
      textScale: 125,
      lineHeight: "relaxed",
      highlightFocus: true,
      highlightLinks: true,
      contrastTheme: "high",
      cursorMode: "large-dark",
    },
  },
  "focus-mode": {
    id: "focus-mode",
    label: "Focus mode",
    description: "Reduces decorative clutter and keeps focus visible.",
    preferences: {
      reduceDecorativeImages: true,
      stopAnimations: true,
      reduceClutter: true,
      highlightFocus: true,
      readingMask: false,
    },
  },
  "reading-support": {
    id: "reading-support",
    label: "Reading support",
    description: "Readable type, spacing, left-aligned prose, emphasised headings.",
    preferences: {
      fontMode: "readable",
      textScale: 125,
      lineHeight: "relaxed",
      letterSpacing: "increased",
      contentAlignment: "left",
      highlightHeadings: true,
      readingGuide: false,
    },
  },
  "comfort-mode": {
    id: "comfort-mode",
    label: "Comfort mode",
    description: "Slightly larger text, calmer colour, reduced motion.",
    preferences: {
      textScale: 112.5,
      lineHeight: "relaxed",
      letterSpacing: "increased",
      reduceMotion: true,
      disableSmoothScrolling: true,
      saturation: "low",
      highlightFocus: true,
    },
  },
};

export const CONTRAST_RATIO_NORMAL_TEXT = 4.5;
export const CONTRAST_RATIO_LARGE_TEXT = 3;

export function parseAccessibilityUiPreferences(
  value: unknown,
): AccessibilityUiPreferences | null {
  const parsed = accessibilityUiPreferencesSchema.safeParse(value);
  if (!parsed.success) return null;
  if (parsed.data.customColors && !areCustomColorsSafe(parsed.data.customColors)) {
    return { ...parsed.data, customColors: undefined };
  }
  return parsed.data;
}

/** Map legacy DigitalPreferences flags into the versioned UI model. */
export function migrateLegacyDigitalPreferences(
  legacy: LegacyDigitalPreferences | null | undefined,
): AccessibilityUiPreferences {
  const base = legacy?.ui
    ? parseAccessibilityUiPreferences(legacy.ui) ?? {
        ...DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
      }
    : { ...DEFAULT_ACCESSIBILITY_UI_PREFERENCES };

  if (legacy?.largeText && base.textScale === 100) {
    base.textScale = 125;
  }
  if (legacy?.highContrast && base.contrastTheme === "default") {
    base.contrastTheme = "high";
  }
  if (legacy?.reducedMotion) {
    base.reduceMotion = true;
  }
  if (legacy?.dyslexiaFriendlyMode && base.fontMode === "default") {
    base.fontMode = "dyslexia-friendly";
  }
  // screenReaderUser / voiceControlPreferred / simpleLanguageMode are not UI toggles.
  return base;
}

export function applyPreset(
  current: AccessibilityUiPreferences,
  presetId: AccessibilityPresetId,
): AccessibilityUiPreferences {
  const preset = ACCESSIBILITY_PRESETS[presetId];
  return { ...current, ...preset.preferences, version: 1 };
}

export function preferencesMatchPreset(
  preferences: AccessibilityUiPreferences,
  presetId: AccessibilityPresetId,
): boolean {
  const patch = ACCESSIBILITY_PRESETS[presetId].preferences;
  return (Object.keys(patch) as (keyof AccessibilityUiPreferences)[]).every(
    (key) => preferences[key] === patch[key],
  );
}

export function hasCustomPreferences(
  preferences: AccessibilityUiPreferences,
): boolean {
  return (
    JSON.stringify(preferences) !==
    JSON.stringify(DEFAULT_ACCESSIBILITY_UI_PREFERENCES)
  );
}

export function describePreferenceChanges(
  before: AccessibilityUiPreferences,
  after: AccessibilityUiPreferences,
): string[] {
  const labels: Partial<Record<keyof AccessibilityUiPreferences, string>> = {
    textScale: "Text size",
    fontMode: "Readable font",
    lineHeight: "Line height",
    letterSpacing: "Letter spacing",
    contentAlignment: "Content alignment",
    contrastTheme: "Contrast theme",
    saturation: "Saturation",
    reduceMotion: "Reduce motion",
    stopAnimations: "Stop animations",
    disableSmoothScrolling: "Disable smooth scrolling",
    reduceDecorativeImages: "Reduce decorative images",
    reduceClutter: "Reduce interface clutter",
    readingMode: "Reading mode",
    readingGuide: "Reading guide",
    readingMask: "Reading mask",
    highlightHeadings: "Heading emphasis",
    highlightLinks: "Link emphasis",
    highlightFocus: "Highlight keyboard focus",
    highlightHover: "Highlight hover target",
    textMagnifier: "Text magnifier",
    cursorMode: "Cursor",
    muteAutomaticSounds: "Mute automatic sounds",
    customColors: "Custom colours",
  };

  const changed: string[] = [];
  for (const key of Object.keys(labels) as (keyof AccessibilityUiPreferences)[]) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      const label = labels[key];
      if (label) changed.push(label);
    }
  }
  return changed;
}

function relativeLuminance(hex: string): number {
  const raw = hex.replace("#", "");
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(raw.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function areCustomColorsSafe(
  colors: AccessibilityCustomColors,
): boolean {
  const bg = colors.background ?? "#FFFFFF";
  if (colors.text && contrastRatio(colors.text, bg) < 4.5) return false;
  if (colors.heading && contrastRatio(colors.heading, bg) < 3) return false;
  return true;
}

export function loadPreferencesFromStorage(): AccessibilityUiPreferences {
  if (typeof window === "undefined") {
    return { ...DEFAULT_ACCESSIBILITY_UI_PREFERENCES };
  }
  try {
    const raw = window.localStorage.getItem(ACCESSIBILITY_UI_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ACCESSIBILITY_UI_PREFERENCES };
    const parsed = parseAccessibilityUiPreferences(JSON.parse(raw));
    return parsed ?? { ...DEFAULT_ACCESSIBILITY_UI_PREFERENCES };
  } catch {
    return { ...DEFAULT_ACCESSIBILITY_UI_PREFERENCES };
  }
}

export function savePreferencesToStorage(
  preferences: AccessibilityUiPreferences,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      ACCESSIBILITY_UI_STORAGE_KEY,
      JSON.stringify(preferences),
    );
  } catch {
    // Quota / private mode — fail closed without breaking the app.
  }
}

export function clearPreferencesStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACCESSIBILITY_UI_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function setOrClearDataset(
  root: HTMLElement,
  key: string,
  value: string | null,
): void {
  if (value == null) {
    delete root.dataset[key];
  } else {
    root.dataset[key] = value;
  }
}

/** Apply validated preferences to <html> via data attributes and CSS variables. */
export function applyPreferencesToDocument(
  preferences: AccessibilityUiPreferences,
  options?: { honourSystemReducedMotion?: boolean },
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const honourSystem = options?.honourSystemReducedMotion !== false;
  const systemReduceMotion =
    honourSystem &&
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const reduceMotion = preferences.reduceMotion || systemReduceMotion;
  const stopAnimations = preferences.stopAnimations || reduceMotion;
  const defaults = DEFAULT_ACCESSIBILITY_UI_PREFERENCES;

  // Start clean so reset returns to default presentation without leftover attributes.
  clearPreferencesFromDocument();

  setOrClearDataset(
    root,
    "a11yTextScale",
    preferences.textScale === defaults.textScale
      ? null
      : String(preferences.textScale),
  );
  setOrClearDataset(
    root,
    "a11yFont",
    preferences.fontMode === defaults.fontMode ? null : preferences.fontMode,
  );
  setOrClearDataset(
    root,
    "a11yLineHeight",
    preferences.lineHeight === defaults.lineHeight
      ? null
      : preferences.lineHeight,
  );
  setOrClearDataset(
    root,
    "a11yLetterSpacing",
    preferences.letterSpacing === defaults.letterSpacing
      ? null
      : preferences.letterSpacing,
  );
  setOrClearDataset(
    root,
    "a11yAlignment",
    preferences.contentAlignment === defaults.contentAlignment
      ? null
      : preferences.contentAlignment,
  );
  setOrClearDataset(
    root,
    "a11yContrast",
    preferences.contrastTheme === defaults.contrastTheme
      ? null
      : preferences.contrastTheme,
  );
  setOrClearDataset(
    root,
    "a11ySaturation",
    preferences.saturation === defaults.saturation
      ? null
      : preferences.saturation,
  );
  setOrClearDataset(root, "a11yMotion", reduceMotion ? "reduce" : null);
  setOrClearDataset(
    root,
    "a11yStopAnimations",
    stopAnimations ? "true" : null,
  );
  setOrClearDataset(
    root,
    "a11ySmoothScroll",
    preferences.disableSmoothScrolling || reduceMotion ? "off" : null,
  );
  setOrClearDataset(
    root,
    "a11yReading",
    preferences.readingMode ? "mode" : null,
  );
  setOrClearDataset(
    root,
    "a11yGuide",
    preferences.readingGuide ? "true" : null,
  );
  setOrClearDataset(root, "a11yMask", preferences.readingMask ? "true" : null);
  setOrClearDataset(
    root,
    "a11yDecorative",
    preferences.reduceDecorativeImages ? "reduce" : null,
  );
  setOrClearDataset(
    root,
    "a11yClutter",
    preferences.reduceClutter ? "reduce" : null,
  );
  setOrClearDataset(
    root,
    "a11yHeadings",
    preferences.highlightHeadings ? "highlight" : null,
  );
  setOrClearDataset(
    root,
    "a11yLinks",
    preferences.highlightLinks ? "highlight" : null,
  );
  setOrClearDataset(
    root,
    "a11yFocus",
    preferences.highlightFocus ? "strong" : null,
  );
  setOrClearDataset(
    root,
    "a11yHover",
    preferences.highlightHover ? "highlight" : null,
  );
  setOrClearDataset(
    root,
    "a11yMagnifier",
    preferences.textMagnifier ? "true" : null,
  );
  setOrClearDataset(
    root,
    "a11yCursor",
    preferences.cursorMode === defaults.cursorMode
      ? null
      : preferences.cursorMode,
  );
  setOrClearDataset(
    root,
    "a11yMute",
    preferences.muteAutomaticSounds ? "true" : null,
  );

  if (preferences.textScale !== defaults.textScale) {
    root.style.setProperty(
      "--a11y-text-scale",
      `${preferences.textScale / 100}`,
    );
  } else {
    root.style.removeProperty("--a11y-text-scale");
  }

  if (
    preferences.customColors &&
    areCustomColorsSafe(preferences.customColors)
  ) {
    if (preferences.customColors.text) {
      root.style.setProperty("--a11y-custom-text", preferences.customColors.text);
    }
    if (preferences.customColors.heading) {
      root.style.setProperty(
        "--a11y-custom-heading",
        preferences.customColors.heading,
      );
    }
    if (preferences.customColors.background) {
      root.style.setProperty(
        "--a11y-custom-bg",
        preferences.customColors.background,
      );
    }
    root.dataset.a11yCustomColors = "true";
  }
}

export function clearPreferencesFromDocument(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const keys = [
    "a11yTextScale",
    "a11yFont",
    "a11yLineHeight",
    "a11yLetterSpacing",
    "a11yAlignment",
    "a11yContrast",
    "a11ySaturation",
    "a11yMotion",
    "a11yStopAnimations",
    "a11ySmoothScroll",
    "a11yReading",
    "a11yGuide",
    "a11yMask",
    "a11yDecorative",
    "a11yClutter",
    "a11yHeadings",
    "a11yLinks",
    "a11yFocus",
    "a11yHover",
    "a11yMagnifier",
    "a11yCursor",
    "a11yMute",
    "a11yCustomColors",
  ] as const;
  for (const key of keys) {
    delete root.dataset[key];
  }
  root.style.removeProperty("--a11y-text-scale");
  root.style.removeProperty("--a11y-custom-text");
  root.style.removeProperty("--a11y-custom-heading");
  root.style.removeProperty("--a11y-custom-bg");
}

/**
 * Inline script source for pre-hydration preference application.
 * Only applies allow-listed scalars — never injects arbitrary CSS.
 */
export function getPreHydrationAccessibilityScript(): string {
  return `(function(){try{var k=${JSON.stringify(ACCESSIBILITY_UI_STORAGE_KEY)};var raw=localStorage.getItem(k);if(!raw)return;var p=JSON.parse(raw);if(!p||p.version!==1)return;var root=document.documentElement;var scales={100:1,112.5:1.125,125:1.25,150:1.5,200:2};var fonts={default:1,readable:1,"dyslexia-friendly":1};var contrasts={default:1,light:1,dark:1,high:1};var sats={default:1,low:1,high:1,monochrome:1};if(scales[p.textScale]){root.dataset.a11yTextScale=String(p.textScale);root.style.setProperty("--a11y-text-scale",String(scales[p.textScale]));}if(fonts[p.fontMode])root.dataset.a11yFont=p.fontMode;if(contrasts[p.contrastTheme])root.dataset.a11yContrast=p.contrastTheme;if(sats[p.saturation])root.dataset.a11ySaturation=p.saturation;var sys=window.matchMedia("(prefers-reduced-motion: reduce)").matches;if(p.reduceMotion||sys)root.dataset.a11yMotion="reduce";if(p.stopAnimations||p.reduceMotion||sys)root.dataset.a11yStopAnimations="true";if(p.disableSmoothScrolling||p.reduceMotion||sys)root.dataset.a11ySmoothScroll="off";}catch(e){}})();`;
}

/** Merge UI prefs into digitalPreferences JSON without dropping legacy flags. */
export function mergeUiIntoDigitalPreferences(
  existing: LegacyDigitalPreferences | null | undefined,
  ui: AccessibilityUiPreferences,
): LegacyDigitalPreferences {
  const next: LegacyDigitalPreferences = { ...(existing ?? {}), ui };
  next.largeText = ui.textScale >= 125;
  next.highContrast = ui.contrastTheme === "high";
  next.reducedMotion = ui.reduceMotion;
  next.dyslexiaFriendlyMode = ui.fontMode === "dyslexia-friendly";
  return next;
}
