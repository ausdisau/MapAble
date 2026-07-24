"use client";

import { useEffect, useState } from "react";

/**
 * Tracks browser online/offline status for PWA-aware UI.
 * Defaults to online during SSR to avoid hydration flicker.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    function sync() {
      setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    }
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return online;
}
