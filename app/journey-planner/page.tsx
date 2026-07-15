import type { Metadata } from "next";

import { JourneyPlannerForm } from "@/components/journey/JourneyPlannerForm";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Accessible Journey Planner | MapAble",
  description:
    "Plan accessible trips with destination access notes, transport options, buffers, and support worker meeting options.",
};

export default function JourneyPlannerPage() {
  return (
    <MapAbleCareMarketingShell>
      <JourneyPlannerForm />
    </MapAbleCareMarketingShell>
  );
}
