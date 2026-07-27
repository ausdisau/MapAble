import { createContext, useContext, useCallback, useEffect, useState } from "react";

export type AccessibilityMode = "easy-read" | "high-contrast" | "screen-reader-optimized";

const STORAGE_KEYS: Record<AccessibilityMode, string> = {
  "easy-read": "easy-read",
  "high-contrast": "high-contrast",
  "screen-reader-optimized": "screen-reader-optimized",
};

const MODES: AccessibilityMode[] = ["easy-read", "high-contrast", "screen-reader-optimized"];

type AccessibilityState = Record<AccessibilityMode, boolean>;

interface AccessibilityContextValue {
  modes: AccessibilityState;
  isEnabled: (mode: AccessibilityMode) => boolean;
  setMode: (mode: AccessibilityMode, enabled: boolean) => void;
  toggleMode: (mode: AccessibilityMode) => void;
}

function readInitialState(): AccessibilityState {
  const state = {} as AccessibilityState;
  for (const mode of MODES) {
    let enabled = false;
    if (typeof window !== "undefined") {
      enabled = window.localStorage.getItem(STORAGE_KEYS[mode]) === "true";
    }
    state[mode] = enabled;
  }
  return state;
}

function applyClass(mode: AccessibilityMode, enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(mode, enabled);
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [modes, setModes] = useState<AccessibilityState>(readInitialState);

  useEffect(() => {
    for (const mode of MODES) {
      applyClass(mode, modes[mode]);
    }
  }, [modes]);

  const setMode = useCallback((mode: AccessibilityMode, enabled: boolean) => {
    setModes((prev) => {
      if (prev[mode] === enabled) return prev;
      const next = { ...prev, [mode]: enabled };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEYS[mode], String(enabled));
      }
      applyClass(mode, enabled);
      return next;
    });
  }, []);

  const toggleMode = useCallback((mode: AccessibilityMode) => {
    setModes((prev) => {
      const enabled = !prev[mode];
      const next = { ...prev, [mode]: enabled };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEYS[mode], String(enabled));
      }
      applyClass(mode, enabled);
      return next;
    });
  }, []);

  const isEnabled = useCallback((mode: AccessibilityMode) => modes[mode], [modes]);

  return (
    <AccessibilityContext.Provider value={{ modes, isEnabled, setMode, toggleMode }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return ctx;
}
