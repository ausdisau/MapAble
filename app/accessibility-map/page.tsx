import type { Metadata } from "next";

import { AccessibilityMapLanding } from "@/components/accessibility-map/AccessibilityMapLanding";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { getAccessMapPlaces } from "@/lib/access-map/access-map-places";
import { MAPABLE_ADL_SOURCE_LABEL } from "@/lib/access-map/copy";

export const metadata: Metadata = {
  title: "Accessibility Map | MapAble",
  description:
    "Know before you go. Search accessible places with practical details, confidence levels, measurements, and transport options — including MapAble by Australian Disability Ltd locations.",
};

export default async function AccessibilityMapPage() {
  const places = await getAccessMapPlaces();
  const partnerCount = places.filter((p) => !p.isDemo).length;

  return (
    <MapAbleCareMarketingShell>
      <AccessibilityMapLanding
        initialPlaces={places}
        dataSourceNote={
          partnerCount > 0
            ? `Includes ${partnerCount.toLocaleString("en-AU")} locations from ${MAPABLE_ADL_SOURCE_LABEL}.`
            : undefined
        }
      />
    </MapAbleCareMarketingShell>
  );
}
