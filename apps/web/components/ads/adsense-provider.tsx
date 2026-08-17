import type { ReactNode } from "react";

import { AdSenseDisplayUnit } from "@/components/ads/AdSenseDisplayUnit";
import type {
  AdUnitDefinition,
  AdvertisingUnitProvider,
} from "@/lib/ads/ad-unit";
import { canRenderAdSenseDisplayUnit } from "@/lib/ads/adsense-config";

function canRenderAdSenseUnit(unit: AdUnitDefinition): boolean {
  if (unit.provider !== "adsense") return false;
  if (unit.format !== "display") return false;
  return canRenderAdSenseDisplayUnit();
}

export const adsenseAdvertisingProvider: AdvertisingUnitProvider = {
  id: "adsense",
  canRender: canRenderAdSenseUnit,
  render(unit: AdUnitDefinition): ReactNode {
    if (!canRenderAdSenseUnit(unit)) return null;
    return <AdSenseDisplayUnit unit={unit} />;
  },
};
