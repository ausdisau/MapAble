"use client";

import { useEffect, useRef } from "react";

import type { AdUnitDefinition } from "@/lib/ads/ad-unit";
import {
  ADSENSE_CLIENT_ID,
  canRenderAdSenseDisplayUnit,
  getAdSenseSlotForUnit,
} from "@/lib/ads/adsense-config";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSenseDisplayUnitProps = {
  unit: AdUnitDefinition;
};

/**
 * Renders a labelled AdSense display `<ins>` and pushes to adsbygoogle.
 * No-ops when AdSense is disabled or the unit slot env var is unset.
 */
export function AdSenseDisplayUnit({ unit }: AdSenseDisplayUnitProps) {
  const pushedRef = useRef(false);
  const slot = getAdSenseSlotForUnit(unit.key);

  useEffect(() => {
    if (!canRenderAdSenseDisplayUnit() || !slot || pushedRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {
      // AdSense script may be blocked; fail silently.
    }
  }, [slot]);

  if (!canRenderAdSenseDisplayUnit() || !slot) {
    return null;
  }

  return (
    <aside
      className="mb-10 rounded-[1.5rem] border border-slate-200 bg-white p-5"
      aria-label={unit.disclosureLabel}
    >
      <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {unit.disclosureLabel}
      </p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
