"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useId, useRef, useState } from "react";

import {
  AccessibilityAdjustmentControl,
  AccessibilityToggleControl,
} from "@/components/accessibility/AccessibilityAdjustmentControl";
import { useAccessibilityPreferences } from "@/components/accessibility/AccessibilityPreferencesProvider";
import { AccessibilityProfilePreset } from "@/components/accessibility/AccessibilityProfilePreset";
import {
  areCustomColorsSafe,
  CONTRAST_RATIO_NORMAL_TEXT,
  contrastRatio,
} from "@/lib/accessibility/ui-preferences";
import type {
  AccessibilityContentAlignment,
  AccessibilityContrastTheme,
  AccessibilityCursorMode,
  AccessibilityFontMode,
  AccessibilityLetterSpacing,
  AccessibilityLineHeight,
  AccessibilityPresetId,
  AccessibilitySaturation,
  AccessibilityTextScale,
} from "@/types/accessibility-ui";

const PRESET_IDS: AccessibilityPresetId[] = [
  "reduce-motion",
  "clearer-vision",
  "focus-mode",
  "reading-support",
  "comfort-mode",
];

const TEXT_SCALE_OPTIONS: Array<{ value: AccessibilityTextScale; label: string }> = [
  { value: 100, label: "Default (100%)" },
  { value: 112.5, label: "Large (112.5%)" },
  { value: 125, label: "Larger (125%)" },
  { value: 150, label: "Extra large (150%)" },
  { value: 200, label: "Maximum (200%)" },
];

export function AccessibilityPanel() {
  const {
    preferences,
    setPreference,
    resetPreferences,
    closePanel,
    isPanelOpen,
    hasCustomPreferences,
    lastPresetChanges,
    saveToAccount,
    loadFromAccount,
    statusMessage,
  } = useAccessibilityPreferences();
  const { status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated";

  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [syncBusy, setSyncBusy] = useState<"save" | "load" | null>(null);
  const [syncMessage, setSyncMessage] = useState("");
  const [customText, setCustomText] = useState(preferences.customColors?.text ?? "");
  const [customHeading, setCustomHeading] = useState(preferences.customColors?.heading ?? "");
  const [customBackground, setCustomBackground] = useState(
    preferences.customColors?.background ?? "",
  );
  const [colorError, setColorError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isPanelOpen) {
      if (!dialog.open) dialog.showModal();
      window.setTimeout(() => closeButtonRef.current?.focus(), 0);
      setConfirmReset(false);
      setSyncMessage("");
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isPanelOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onCancel = (event: Event) => {
      event.preventDefault();
      closePanel();
    };

    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [closePanel]);

  useEffect(() => {
    setCustomText(preferences.customColors?.text ?? "");
    setCustomHeading(preferences.customColors?.heading ?? "");
    setCustomBackground(preferences.customColors?.background ?? "");
  }, [preferences.customColors]);

  const applyCustomColors = () => {
    const next = {
      text: customText.trim() || undefined,
      heading: customHeading.trim() || undefined,
      background: customBackground.trim() || undefined,
    };

    if (!next.text && !next.heading && !next.background) {
      setPreference("customColors", undefined);
      setColorError(null);
      return;
    }

    if (!areCustomColorsSafe(next)) {
      setColorError(
        `These colours do not meet the ${CONTRAST_RATIO_NORMAL_TEXT}:1 contrast requirement for normal text. Adjust them or restore safe colours.`,
      );
      return;
    }

    setPreference("customColors", next);
    setColorError(null);
  };

  const restoreSafeColors = () => {
    setCustomText("");
    setCustomHeading("");
    setCustomBackground("");
    setPreference("customColors", undefined);
    setColorError(null);
  };

  const textBgRatio =
    customText && customBackground ? contrastRatio(customText, customBackground) : null;

  return (
    <dialog
      ref={dialogRef}
      className="a11y-panel"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-a11y-panel
      data-testid="accessibility-panel"
    >
      <div className="a11y-panel__inner">
        <header className="a11y-panel__header">
          <button
            ref={closeButtonRef}
            type="button"
            className="a11y-panel__close mapable-focus"
            onClick={closePanel}
            data-testid="accessibility-panel-close"
          >
            Close
          </button>
          <h2 id={titleId} className="a11y-panel__title">
            Accessibility settings
          </h2>
          <p id={descriptionId} className="a11y-panel__description">
            These settings change how MapAble looks and behaves on this device. They personalise
            presentation only — MapAble stays keyboard and screen-reader accessible whether or not
            you change them. They do not create or certify WCAG conformance.
          </p>
          <p className="a11y-panel__status" aria-live="polite">
            {hasCustomPreferences
              ? "Custom settings active · Saved on this device"
              : "Saved on this device"}
            {statusMessage ? ` ${statusMessage}` : ""}
          </p>
        </header>

        <div className="a11y-panel__body">
          <section className="a11y-panel__section" aria-labelledby="a11y-quick-heading">
            <h3 id="a11y-quick-heading" className="a11y-panel__section-title">
              Quick settings
            </h3>
            <p className="a11y-panel__section-help">
              Apply a goal-based starting point, then adjust individual settings. Presets are Apply
              actions, not medical or diagnostic profiles.
            </p>
            <div className="a11y-panel__presets">
              {PRESET_IDS.map((presetId) => (
                <AccessibilityProfilePreset key={presetId} presetId={presetId} />
              ))}
            </div>
            {lastPresetChanges.length > 0 ? (
              <div className="a11y-panel__changes" aria-live="polite">
                <p className="a11y-panel__changes-title">Settings that changed</p>
                <ul>
                  {lastPresetChanges.map((change) => (
                    <li key={change}>{change}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="a11y-panel__section" aria-labelledby="a11y-text-heading">
            <h3 id="a11y-text-heading" className="a11y-panel__section-title">
              Text and reading
            </h3>
            <AccessibilityAdjustmentControl
              id="a11y-text-scale"
              label="Text size"
              value={preferences.textScale}
              options={TEXT_SCALE_OPTIONS}
              onChange={(value) => setPreference("textScale", value)}
            />
            <AccessibilityAdjustmentControl
              id="a11y-font"
              label="Readable font"
              description="No single font works for every reader. The dyslexia-friendly option uses clearer letter shapes only."
              value={preferences.fontMode}
              options={[
                { value: "default" as AccessibilityFontMode, label: "Default MapAble font" },
                { value: "readable" as AccessibilityFontMode, label: "Readable sans-serif" },
                {
                  value: "dyslexia-friendly" as AccessibilityFontMode,
                  label: "Dyslexia-friendly option",
                },
              ]}
              onChange={(value) => setPreference("fontMode", value)}
            />
            <AccessibilityAdjustmentControl
              id="a11y-line-height"
              label="Line height"
              value={preferences.lineHeight}
              options={[
                { value: "default" as AccessibilityLineHeight, label: "Default" },
                { value: "relaxed" as AccessibilityLineHeight, label: "Relaxed" },
                { value: "extra-relaxed" as AccessibilityLineHeight, label: "Extra relaxed" },
              ]}
              onChange={(value) => setPreference("lineHeight", value)}
            />
            <AccessibilityAdjustmentControl
              id="a11y-letter-spacing"
              label="Letter spacing"
              value={preferences.letterSpacing}
              options={[
                { value: "default" as AccessibilityLetterSpacing, label: "Default" },
                { value: "increased" as AccessibilityLetterSpacing, label: "Increased" },
                {
                  value: "extra-increased" as AccessibilityLetterSpacing,
                  label: "Extra increased",
                },
              ]}
              onChange={(value) => setPreference("letterSpacing", value)}
            />
            <AccessibilityAdjustmentControl
              id="a11y-alignment"
              label="Reading content alignment"
              description="Applies to reading and prose content only — not forms, tables, navigation, buttons, maps or dashboards."
              value={preferences.contentAlignment}
              options={[
                { value: "default" as AccessibilityContentAlignment, label: "Default" },
                { value: "left" as AccessibilityContentAlignment, label: "Left" },
                { value: "center" as AccessibilityContentAlignment, label: "Centre" },
                { value: "right" as AccessibilityContentAlignment, label: "Right" },
              ]}
              onChange={(value) => setPreference("contentAlignment", value)}
            />
            <AccessibilityToggleControl
              id="a11y-headings"
              label="Highlight headings"
              checked={preferences.highlightHeadings}
              onChange={(checked) => setPreference("highlightHeadings", checked)}
            />
            <AccessibilityToggleControl
              id="a11y-links"
              label="Always underline / highlight links"
              checked={preferences.highlightLinks}
              onChange={(checked) => setPreference("highlightLinks", checked)}
            />
            <AccessibilityToggleControl
              id="a11y-magnifier"
              label="Text magnifier"
              description="Shows a visual enlargement near hovered or keyboard-focused text. It does not change accessible names."
              checked={preferences.textMagnifier}
              onChange={(checked) => setPreference("textMagnifier", checked)}
            />
          </section>

          <section className="a11y-panel__section" aria-labelledby="a11y-colour-heading">
            <h3 id="a11y-colour-heading" className="a11y-panel__section-title">
              Colour and contrast
            </h3>
            <AccessibilityAdjustmentControl
              id="a11y-contrast"
              label="Contrast theme"
              description="Forced-colours mode from your operating system always takes precedence when active."
              value={preferences.contrastTheme}
              options={[
                { value: "default" as AccessibilityContrastTheme, label: "Default" },
                { value: "light" as AccessibilityContrastTheme, label: "Light contrast" },
                { value: "dark" as AccessibilityContrastTheme, label: "Dark contrast" },
                { value: "high" as AccessibilityContrastTheme, label: "High contrast" },
              ]}
              onChange={(value) => setPreference("contrastTheme", value)}
            />
            <AccessibilityAdjustmentControl
              id="a11y-saturation"
              label="Saturation"
              value={preferences.saturation}
              options={[
                { value: "default" as AccessibilitySaturation, label: "Default" },
                { value: "low" as AccessibilitySaturation, label: "Low saturation" },
                { value: "high" as AccessibilitySaturation, label: "High saturation" },
                { value: "monochrome" as AccessibilitySaturation, label: "Monochrome" },
              ]}
              onChange={(value) => setPreference("saturation", value)}
            />
            <fieldset className="rounded-xl border border-slate-200 p-3">
              <legend className="px-1 text-sm font-semibold text-[#0C1833]">
                Custom colours (optional)
              </legend>
              <p className="mt-1 text-xs text-slate-600">
                Combinations below 4.5:1 for normal text are blocked. Status meaning still uses text
                and icons, not colour alone.
              </p>
              <div className="a11y-panel__color-fields">
                <label className="a11y-panel__color-field">
                  Text
                  <input
                    type="text"
                    placeholder="#111827"
                    value={customText}
                    onChange={(event) => setCustomText(event.target.value)}
                    className="a11y-panel__input mapable-focus"
                  />
                </label>
                <label className="a11y-panel__color-field">
                  Headings
                  <input
                    type="text"
                    placeholder="#0C1833"
                    value={customHeading}
                    onChange={(event) => setCustomHeading(event.target.value)}
                    className="a11y-panel__input mapable-focus"
                  />
                </label>
                <label className="a11y-panel__color-field">
                  Background
                  <input
                    type="text"
                    placeholder="#FFFFFF"
                    value={customBackground}
                    onChange={(event) => setCustomBackground(event.target.value)}
                    className="a11y-panel__input mapable-focus"
                  />
                </label>
              </div>
              {textBgRatio != null ? (
                <p className="a11y-panel__contrast-live" aria-live="polite">
                  Text / background contrast: {textBgRatio.toFixed(2)}:1
                  {textBgRatio < CONTRAST_RATIO_NORMAL_TEXT ? " (below 4.5:1)" : ""}
                </p>
              ) : null}
              {colorError ? (
                <p className="a11y-panel__error" role="alert">
                  {colorError}
                </p>
              ) : null}
              <div className="a11y-panel__inline-actions">
                <button
                  type="button"
                  className="a11y-panel__secondary-btn mapable-focus"
                  onClick={applyCustomColors}
                >
                  Apply custom colours
                </button>
                <button
                  type="button"
                  className="a11y-panel__secondary-btn mapable-focus"
                  onClick={restoreSafeColors}
                >
                  Restore safe colours
                </button>
              </div>
            </fieldset>
          </section>

          <section className="a11y-panel__section" aria-labelledby="a11y-motion-heading">
            <h3 id="a11y-motion-heading" className="a11y-panel__section-title">
              Motion and distractions
            </h3>
            <p className="a11y-panel__section-help">
              If your device asks for reduced motion, MapAble will not enable decorative animation
              over that request.
            </p>
            <AccessibilityToggleControl
              id="a11y-reduce-motion"
              label="Reduce motion"
              checked={preferences.reduceMotion}
              onChange={(checked) => setPreference("reduceMotion", checked)}
            />
            <AccessibilityToggleControl
              id="a11y-stop-animations"
              label="Stop decorative animations"
              description="Keeps necessary progress indicators as static, understandable status."
              checked={preferences.stopAnimations}
              onChange={(checked) => setPreference("stopAnimations", checked)}
            />
            <AccessibilityToggleControl
              id="a11y-smooth-scroll"
              label="Disable smooth scrolling"
              checked={preferences.disableSmoothScrolling}
              onChange={(checked) => setPreference("disableSmoothScrolling", checked)}
            />
            <AccessibilityToggleControl
              id="a11y-decorative"
              label="Reduce decorative imagery"
              checked={preferences.reduceDecorativeImages}
              onChange={(checked) => setPreference("reduceDecorativeImages", checked)}
            />
            <AccessibilityToggleControl
              id="a11y-clutter"
              label="Reduce interface clutter"
              checked={preferences.reduceClutter}
              onChange={(checked) => setPreference("reduceClutter", checked)}
            />
            <AccessibilityToggleControl
              id="a11y-reading-mode"
              label="Reading mode"
              description="Hides only sections marked as non-essential. Alerts, navigation, forms and service results stay visible."
              checked={preferences.readingMode}
              onChange={(checked) => setPreference("readingMode", checked)}
            />
            <AccessibilityToggleControl
              id="a11y-reading-guide"
              label="Reading guide"
              checked={preferences.readingGuide}
              onChange={(checked) => setPreference("readingGuide", checked)}
            />
            <AccessibilityToggleControl
              id="a11y-reading-mask"
              label="Reading mask"
              description="Dims content outside a reading band. Use Arrow Up/Down to move the band when the mask is on."
              checked={preferences.readingMask}
              onChange={(checked) => setPreference("readingMask", checked)}
            />
          </section>

          <section className="a11y-panel__section" aria-labelledby="a11y-nav-heading">
            <h3 id="a11y-nav-heading" className="a11y-panel__section-title">
              Navigation and pointer
            </h3>
            <AccessibilityToggleControl
              id="a11y-focus"
              label="Highlight keyboard focus"
              description="Supplements MapAble’s always-on focus indicators."
              checked={preferences.highlightFocus}
              onChange={(checked) => setPreference("highlightFocus", checked)}
            />
            <AccessibilityToggleControl
              id="a11y-hover"
              label="Highlight hover target"
              checked={preferences.highlightHover}
              onChange={(checked) => setPreference("highlightHover", checked)}
            />
            <AccessibilityAdjustmentControl
              id="a11y-cursor"
              label="Cursor"
              description="Custom cursors are not applied on touch-only devices. Maps and drag surfaces stay usable."
              value={preferences.cursorMode}
              options={[
                { value: "default" as AccessibilityCursorMode, label: "Default cursor" },
                { value: "large-dark" as AccessibilityCursorMode, label: "Large dark cursor" },
                { value: "large-light" as AccessibilityCursorMode, label: "Large light cursor" },
              ]}
              onChange={(value) => setPreference("cursorMode", value)}
            />
          </section>

          <section className="a11y-panel__section" aria-labelledby="a11y-help-heading">
            <h3 id="a11y-help-heading" className="a11y-panel__section-title">
              Help and accessibility information
            </h3>
            <div className="a11y-panel__help">
              <h4 className="a11y-panel__help-title">Keyboard help</h4>
              <ul>
                <li>
                  <kbd>Tab</kbd>: move forward
                </li>
                <li>
                  <kbd>Shift</kbd> + <kbd>Tab</kbd>: move backward
                </li>
                <li>
                  <kbd>Enter</kbd>: activate links and buttons
                </li>
                <li>
                  <kbd>Space</kbd>: operate buttons and checkboxes
                </li>
                <li>
                  <kbd>Escape</kbd>: close panels and dialogs
                </li>
              </ul>
              <p>
                Arrow keys work only in widgets that support them (for example menus, tabs and the
                reading mask). MapAble does not add global letter shortcuts that can conflict with
                screen readers or the browser.
              </p>
              <h4 className="a11y-panel__help-title">Screen-reader help</h4>
              <p>
                MapAble is designed to remain screen-reader compatible without enabling a special
                mode. Keyboard navigation and screen-reader support are always on.
              </p>
              <ul>
                <li>
                  <Link href="/accessibility-statement" className="mapable-focus underline">
                    Accessibility statement
                  </Link>
                </li>
                <li>
                  <Link href="/contact?topic=accessibility" className="mapable-focus underline">
                    Report an accessibility barrier
                  </Link>
                </li>
                <li>
                  Interactive maps offer a list alternative for the same places and access
                  information.
                </li>
              </ul>
            </div>
          </section>

          <section className="a11y-panel__section" aria-labelledby="a11y-reset-heading">
            <h3 id="a11y-reset-heading" className="a11y-panel__section-title">
              Reset and account synchronisation
            </h3>
            {!confirmReset ? (
              <button
                type="button"
                className="a11y-panel__secondary-btn mapable-focus"
                onClick={() => setConfirmReset(true)}
                data-testid="accessibility-reset"
              >
                Reset display settings
              </button>
            ) : (
              <div className="a11y-panel__confirm" role="group" aria-label="Confirm reset">
                <p>
                  Reset removes saved settings on this device and returns to the default
                  presentation.
                </p>
                <div className="a11y-panel__inline-actions">
                  <button
                    type="button"
                    className="a11y-panel__danger-btn mapable-focus"
                    onClick={() => {
                      resetPreferences();
                      setConfirmReset(false);
                    }}
                    data-testid="accessibility-reset-confirm"
                  >
                    Confirm reset
                  </button>
                  <button
                    type="button"
                    className="a11y-panel__secondary-btn mapable-focus"
                    onClick={() => setConfirmReset(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {isAuthenticated ? (
              <div className="a11y-panel__account">
                <h4 className="a11y-panel__help-title">Optional account sync</h4>
                <p>
                  Save these display settings to your MapAble account only if you choose to. They
                  stay private by default and are not shared with providers, workers or transport
                  operators. Sync does not change your mobility, communication or sharing profile.
                </p>
                <div className="a11y-panel__inline-actions">
                  <button
                    type="button"
                    className="a11y-panel__primary-btn mapable-focus"
                    disabled={syncBusy != null}
                    data-testid="accessibility-save-account"
                    onClick={() => {
                      setSyncBusy("save");
                      void saveToAccount().then((result) => {
                        setSyncMessage(result.message);
                        setSyncBusy(null);
                      });
                    }}
                  >
                    {syncBusy === "save"
                      ? "Saving…"
                      : "Save these display settings to my MapAble account"}
                  </button>
                  <button
                    type="button"
                    className="a11y-panel__secondary-btn mapable-focus"
                    disabled={syncBusy != null}
                    data-testid="accessibility-load-account"
                    onClick={() => {
                      setSyncBusy("load");
                      void loadFromAccount().then((result) => {
                        setSyncMessage(result.message);
                        setSyncBusy(null);
                      });
                    }}
                  >
                    {syncBusy === "load" ? "Loading…" : "Load from my account"}
                  </button>
                </div>
                {syncMessage ? (
                  <p
                    className="a11y-panel__sync-message"
                    role="status"
                    aria-live="polite"
                    data-testid="accessibility-sync-status"
                  >
                    {syncMessage}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="a11y-panel__section-help">
                Sign in to optionally save these display settings to your MapAble account so they
                can follow you across devices.
              </p>
            )}
          </section>
        </div>
      </div>
    </dialog>
  );
}
