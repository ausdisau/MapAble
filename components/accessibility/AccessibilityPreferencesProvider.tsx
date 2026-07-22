"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AccessibilityPanel } from "@/components/accessibility/AccessibilityPanel";
import {
  applyPreferencesToDocument,
  applyPreset as applyPresetToPreferences,
  clearPreferencesFromDocument,
  clearPreferencesStorage,
  DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
  describePreferenceChanges,
  hasCustomPreferences as computeHasCustom,
  loadPreferencesFromStorage,
  parseAccessibilityUiPreferences,
  preferencesMatchPreset,
  savePreferencesToStorage,
} from "@/lib/accessibility/ui-preferences";
import type {
  AccessibilityPresetId,
  AccessibilityUiPreferences,
} from "@/types/accessibility-ui";

type AccessibilityPreferencesContextValue = {
  preferences: AccessibilityUiPreferences;
  setPreference: <K extends keyof AccessibilityUiPreferences>(
    key: K,
    value: AccessibilityUiPreferences[K],
  ) => void;
  applyPreset: (id: AccessibilityPresetId) => string[];
  resetPreferences: () => void;
  openPanel: (triggerElement?: HTMLElement | null) => void;
  closePanel: () => void;
  isPanelOpen: boolean;
  hasCustomPreferences: boolean;
  activePresetId: AccessibilityPresetId | null;
  lastPresetChanges: string[];
  saveToAccount: () => Promise<{ ok: boolean; message: string }>;
  loadFromAccount: () => Promise<{ ok: boolean; message: string }>;
  statusMessage: string;
};

const AccessibilityPreferencesContext =
  createContext<AccessibilityPreferencesContextValue | null>(null);

const PRESET_IDS: AccessibilityPresetId[] = [
  "reduce-motion",
  "clearer-vision",
  "focus-mode",
  "reading-support",
  "comfort-mode",
];

export function useAccessibilityPreferences(): AccessibilityPreferencesContextValue {
  const ctx = useContext(AccessibilityPreferencesContext);
  if (!ctx) {
    throw new Error(
      "useAccessibilityPreferences must be used within AccessibilityPreferencesProvider",
    );
  }
  return ctx;
}

export function useAccessibilityPreferencesOptional(): AccessibilityPreferencesContextValue | null {
  return useContext(AccessibilityPreferencesContext);
}

export function AccessibilityPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<AccessibilityUiPreferences>(
    () =>
      typeof window === "undefined"
        ? { ...DEFAULT_ACCESSIBILITY_UI_PREFERENCES }
        : loadPreferencesFromStorage(),
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [lastPresetChanges, setLastPresetChanges] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const loaded = loadPreferencesFromStorage();
    setPreferences(loaded);
    applyPreferencesToDocument(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyPreferencesToDocument(preferences);
    if (computeHasCustom(preferences)) {
      savePreferencesToStorage(preferences);
    } else {
      // Only clear after hydration so the initial default state cannot wipe stored prefs.
      clearPreferencesStorage();
    }
  }, [preferences, hydrated]);

  const setPreference = useCallback(
    <K extends keyof AccessibilityUiPreferences>(
      key: K,
      value: AccessibilityUiPreferences[K],
    ) => {
      setPreferences((current) => ({ ...current, [key]: value, version: 1 }));
      setLastPresetChanges([]);
      setStatusMessage("Display setting updated. Saved on this device.");
    },
    [],
  );

  const applyPreset = useCallback((id: AccessibilityPresetId) => {
    let changes: string[] = [];
    setPreferences((current) => {
      const next = applyPresetToPreferences(current, id);
      changes = describePreferenceChanges(current, next);
      return next;
    });
    setLastPresetChanges(changes);
    setStatusMessage(
      changes.length
        ? `Applied preset. Changed: ${changes.join(", ")}.`
        : "Preset already matches your current settings.",
    );
    return changes;
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences({ ...DEFAULT_ACCESSIBILITY_UI_PREFERENCES });
    clearPreferencesStorage();
    clearPreferencesFromDocument();
    setLastPresetChanges([]);
    setStatusMessage("Display settings reset to defaults on this device.");
  }, []);

  const openPanel = useCallback((triggerElement?: HTMLElement | null) => {
    if (triggerElement) triggerRef.current = triggerElement;
    setIsPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    const trigger = triggerRef.current;
    window.setTimeout(() => {
      trigger?.focus();
    }, 0);
  }, []);

  const saveToAccount = useCallback(async () => {
    try {
      const res = await fetch("/api/accessibility-profile/digital-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ui: preferences }),
      });
      if (res.status === 401) {
        return {
          ok: false,
          message: "Sign in to save display settings to your MapAble account.",
        };
      }
      if (!res.ok) {
        return { ok: false, message: "Could not save settings to your account." };
      }
      setStatusMessage("Display settings saved to your MapAble account.");
      return { ok: true, message: "Saved to your MapAble account." };
    } catch {
      return { ok: false, message: "Could not save settings to your account." };
    }
  }, [preferences]);

  const loadFromAccount = useCallback(async () => {
    try {
      const res = await fetch("/api/accessibility-profile/digital-preferences", {
        method: "GET",
      });
      if (res.status === 401) {
        return {
          ok: false,
          message: "Sign in to load display settings from your account.",
        };
      }
      if (!res.ok) {
        return { ok: false, message: "Could not load account settings." };
      }
      const data = (await res.json()) as {
        data?: { digitalPreferences?: { ui?: AccessibilityUiPreferences } };
        digitalPreferences?: { ui?: AccessibilityUiPreferences };
      };
      const digital = data.data?.digitalPreferences ?? data.digitalPreferences;
      const ui = parseAccessibilityUiPreferences(digital?.ui);
      if (!ui) {
        return {
          ok: false,
          message: "No display settings are saved on your account yet.",
        };
      }
      setPreferences(ui);
      setStatusMessage("Loaded display settings from your MapAble account.");
      return { ok: true, message: "Loaded from your MapAble account." };
    } catch {
      return { ok: false, message: "Could not load account settings." };
    }
  }, []);

  const activePresetId = useMemo(() => {
    for (const id of PRESET_IDS) {
      if (preferencesMatchPreset(preferences, id)) return id;
    }
    return null;
  }, [preferences]);

  const value = useMemo<AccessibilityPreferencesContextValue>(
    () => ({
      preferences,
      setPreference,
      applyPreset,
      resetPreferences,
      openPanel,
      closePanel,
      isPanelOpen,
      hasCustomPreferences: computeHasCustom(preferences),
      activePresetId,
      lastPresetChanges,
      saveToAccount,
      loadFromAccount,
      statusMessage,
    }),
    [
      preferences,
      setPreference,
      applyPreset,
      resetPreferences,
      openPanel,
      closePanel,
      isPanelOpen,
      activePresetId,
      lastPresetChanges,
      saveToAccount,
      loadFromAccount,
      statusMessage,
    ],
  );

  return (
    <AccessibilityPreferencesContext.Provider value={value}>
      {children}
      <AccessibilityPanel />
      {preferences.readingGuide ? <ReadingGuideOverlay /> : null}
      {preferences.readingMask ? <ReadingMaskOverlay /> : null}
      {preferences.textMagnifier ? <TextMagnifierOverlay /> : null}
    </AccessibilityPreferencesContext.Provider>
  );
}

function ReadingGuideOverlay() {
  const [y, setY] = useState(120);

  useEffect(() => {
    function onMove(event: PointerEvent) {
      setY(event.clientY);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setY((current) => Math.min(window.innerHeight - 24, current + 24));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setY((current) => Math.max(24, current - 24));
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 z-[90] h-1 bg-[#005B7F]/70"
      style={{ top: y }}
    />
  );
}

function ReadingMaskOverlay() {
  const [y, setY] = useState(200);
  const [viewportHeight, setViewportHeight] = useState(800);
  const band = 140;

  useEffect(() => {
    setViewportHeight(window.innerHeight);
    function onResize() {
      setViewportHeight(window.innerHeight);
    }
    function onMove(event: PointerEvent) {
      setY(event.clientY);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowDown") {
        setY((current) => Math.min(window.innerHeight - band / 2, current + 24));
      }
      if (event.key === "ArrowUp") {
        setY((current) => Math.max(band / 2, current - 24));
      }
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[85]">
      <div
        className="absolute inset-x-0 top-0 bg-slate-900/45"
        style={{ height: Math.max(0, y - band / 2) }}
      />
      <div
        className="absolute inset-x-0 bottom-0 bg-slate-900/45"
        style={{ height: Math.max(0, viewportHeight - (y + band / 2)) }}
      />
    </div>
  );
}

function TextMagnifierOverlay() {
  const [text, setText] = useState("");
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function updateFromTarget(target: EventTarget | null, x: number, y: number) {
      if (!(target instanceof HTMLElement)) {
        setText("");
        return;
      }
      if (window.matchMedia("(max-width: 640px)").matches) {
        setText("");
        return;
      }
      if (target.closest("[data-a11y-panel]")) {
        setText("");
        return;
      }
      const sample = (target.innerText || target.textContent || "").trim();
      if (!sample || sample.length > 180) {
        setText("");
        return;
      }
      setText(sample.slice(0, 120));
      setPos({ x, y });
    }

    function onFocus(event: FocusEvent) {
      const rect =
        event.target instanceof HTMLElement
          ? event.target.getBoundingClientRect()
          : null;
      updateFromTarget(
        event.target,
        rect ? rect.left : 0,
        rect ? rect.bottom + 8 : 0,
      );
    }
    function onPointer(event: PointerEvent) {
      updateFromTarget(event.target, event.clientX + 16, event.clientY + 16);
    }

    document.addEventListener("focusin", onFocus);
    document.addEventListener("pointerover", onPointer);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("pointerover", onPointer);
    };
  }, []);

  if (!text) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-[95] max-w-sm rounded-xl border border-slate-300 bg-white px-3 py-2 text-xl font-semibold text-[#0C1833] shadow-lg"
      style={{ left: pos.x, top: pos.y }}
    >
      {text}
    </div>
  );
}
