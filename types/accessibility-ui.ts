/** Versioned presentation preferences for the MapAble Accessibility Panel. */

export type AccessibilityTextScale = 100 | 112.5 | 125 | 150 | 200;

export type AccessibilityFontMode = "default" | "readable" | "dyslexia-friendly";

export type AccessibilityLineHeight = "default" | "relaxed" | "extra-relaxed";

export type AccessibilityLetterSpacing =
  | "default"
  | "increased"
  | "extra-increased";

export type AccessibilityContentAlignment =
  | "default"
  | "left"
  | "center"
  | "right";

export type AccessibilityContrastTheme =
  | "default"
  | "light"
  | "dark"
  | "high";

export type AccessibilitySaturation =
  | "default"
  | "low"
  | "high"
  | "monochrome";

export type AccessibilityCursorMode =
  | "default"
  | "large-dark"
  | "large-light";

export type AccessibilityPresetId =
  | "reduce-motion"
  | "clearer-vision"
  | "focus-mode"
  | "reading-support"
  | "comfort-mode";

export type AccessibilityUiPreferenceKey = keyof AccessibilityUiPreferences;

export interface AccessibilityCustomColors {
  text?: string;
  heading?: string;
  background?: string;
}

export interface AccessibilityUiPreferences {
  version: 1;
  textScale: AccessibilityTextScale;
  fontMode: AccessibilityFontMode;
  lineHeight: AccessibilityLineHeight;
  letterSpacing: AccessibilityLetterSpacing;
  contentAlignment: AccessibilityContentAlignment;
  contrastTheme: AccessibilityContrastTheme;
  saturation: AccessibilitySaturation;
  reduceMotion: boolean;
  stopAnimations: boolean;
  disableSmoothScrolling: boolean;
  reduceDecorativeImages: boolean;
  reduceClutter: boolean;
  readingMode: boolean;
  readingGuide: boolean;
  readingMask: boolean;
  highlightHeadings: boolean;
  highlightLinks: boolean;
  highlightFocus: boolean;
  highlightHover: boolean;
  textMagnifier: boolean;
  cursorMode: AccessibilityCursorMode;
  muteAutomaticSounds: boolean;
  customColors?: AccessibilityCustomColors;
}

/** Legacy digital preference flags persisted on AccessibilityProfile. */
export interface LegacyDigitalPreferences {
  largeText?: boolean;
  highContrast?: boolean;
  reducedMotion?: boolean;
  screenReaderUser?: boolean;
  voiceControlPreferred?: boolean;
  dyslexiaFriendlyMode?: boolean;
  simpleLanguageMode?: boolean;
  /** Nested UI prefs when synced to account. */
  ui?: AccessibilityUiPreferences;
}
