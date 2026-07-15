import type { Metadata } from "next";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { VerifyVenueForm } from "@/components/venue/VerifyVenueForm";

export const metadata: Metadata = {
  title: "Verify my venue | MapAble",
  description:
    "Make venue accessibility visible and measurable with MapAble Bronze, Silver and Gold accreditation guidance.",
};

export default function VerifyMyVenuePage() {
  return (
    <MapAbleCareMarketingShell>
      <VerifyVenueForm />
    </MapAbleCareMarketingShell>
  );
}
