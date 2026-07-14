"use client";

import type { DegradedModeIndicator } from "@/lib/platform/offline/degraded-mode";

export function DegradedModeBanner({ indicator }: { indicator: DegradedModeIndicator }) {
  if (!indicator.active) return null;

  return (
    <div
      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      role="status"
      aria-live={indicator.ariaLive}
    >
      <p>{indicator.message}</p>
    </div>
  );
}
