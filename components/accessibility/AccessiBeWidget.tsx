"use client";

import Script from "next/script";

declare global {
  interface Window {
    acsbJS?: {
      init: (config?: Record<string, unknown>) => void;
    };
    __mapableAccessiBeInitialized?: boolean;
  }
}

/**
 * Loads the accessiBe accessibility widget site-wide.
 * Defers init until the document body is ready and guards against double-init
 * during App Router client navigations.
 */
export function AccessiBeWidget() {
  return (
    <Script
      id="accessibe"
      src="https://acsbapp.com/apps/app/dist/js/app.js"
      strategy="lazyOnload"
      onLoad={() => {
        if (typeof window === "undefined") return;
        if (window.__mapableAccessiBeInitialized) return;
        if (!document.body) return;

        try {
          window.acsbJS?.init?.({});
          window.__mapableAccessiBeInitialized = true;
        } catch {
          // Widget DOM attach can race with layout; fail closed without breaking the app.
        }
      }}
    />
  );
}
