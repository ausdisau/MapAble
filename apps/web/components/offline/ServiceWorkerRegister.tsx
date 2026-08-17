"use client";

import { useEffect } from "react";

/**
 * Registers the MapAble offline service worker (Cache API + tile/API strategy).
 * No-ops when service workers are unavailable (SSR, private modes, etc.).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Avoid registering during automated tests / Playwright unless opted in.
    if (process.env.NEXT_PUBLIC_DISABLE_SW === "1") {
      return;
    }

    let cancelled = false;
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (!cancelled) {
          console.info("[mapable-sw] registered", reg.scope);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.warn("[mapable-sw] registration failed", err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
