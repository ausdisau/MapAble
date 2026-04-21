import { useCallback, useEffect, useState } from "react";
import type { WidgetTabKey } from "./types";

const OPEN_KEY = "mapable.widget.open";
const TAB_KEY = "mapable.widget.tab";
const SESSION_KEY = "mapable.widget.activeSessionId";

function readSession<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.sessionStorage.getItem(key);
    if (v === null) return fallback;
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

function writeSession(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function useWidgetState(defaultTab: WidgetTabKey) {
  const [open, setOpenState] = useState<boolean>(() => readSession(OPEN_KEY, false));
  const [activeTab, setActiveTabState] = useState<WidgetTabKey>(() => readSession(TAB_KEY, defaultTab));
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(() =>
    readSession<string | null>(SESSION_KEY, null)
  );

  useEffect(() => {
    writeSession(OPEN_KEY, open);
  }, [open]);

  useEffect(() => {
    writeSession(TAB_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    writeSession(SESSION_KEY, activeSessionId);
  }, [activeSessionId]);

  const setOpen = useCallback((next: boolean) => setOpenState(next), []);
  const setActiveTab = useCallback((next: WidgetTabKey) => setActiveTabState(next), []);
  const setActiveSessionId = useCallback((next: string | null) => setActiveSessionIdState(next), []);
  const toggle = useCallback(() => setOpenState((o) => !o), []);

  return {
    open,
    setOpen,
    toggle,
    activeTab,
    setActiveTab,
    activeSessionId,
    setActiveSessionId,
  };
}
