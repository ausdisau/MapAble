"use client";

import { usePathname } from "next/navigation";

import { adsenseAdvertisingProvider } from "@/components/ads/adsense-provider";
import {
  getAdUnit,
  type AdvertisingUnitProvider,
} from "@/lib/ads/ad-unit";
import { isContentRichMarketingPath } from "@/lib/ads/content-rich-routes";

const providers: Record<string, AdvertisingUnitProvider> = {
  adsense: adsenseAdvertisingProvider,
};

type AdvertisingUnitProps = {
  unitKey: string;
  /** When true, skip content-rich path gating (tests / special placements). */
  skipContentGate?: boolean;
};

/**
 * Resolves a registered ad unit by semantic key, gates by content-rich routes,
 * and delegates to the matching advertising provider.
 */
export function AdvertisingUnit({
  unitKey,
  skipContentGate = false,
}: AdvertisingUnitProps) {
  const pathname = usePathname();
  const unit = getAdUnit(unitKey);

  if (!unit) return null;
  if (!skipContentGate && !isContentRichMarketingPath(pathname)) {
    return null;
  }

  const provider = providers[unit.provider];
  if (!provider?.canRender(unit)) return null;

  return <>{provider.render(unit)}</>;
}
