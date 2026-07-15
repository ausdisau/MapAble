import type { Metadata } from "next";

import { AccessibilityMapLanding } from "@/components/accessibility-map/AccessibilityMapLanding";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { DEMO_ACCESS_PLACES } from "@/lib/demo/accessibility-places";

export const metadata: Metadata = {
  title: "Accessibility Map | MapAble",
  description:
    "Know before you go. Search accessible places with practical details, confidence levels, measurements, and transport options.",
};

export default function AccessibilityMapPage() {
  return (
    <MapAbleCareMarketingShell>
      <AccessibilityMapLanding initialPlaces={DEMO_ACCESS_PLACES} />
    </MapAbleCareMarketingShell>
  );
}
