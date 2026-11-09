import type { Metadata } from "next";

import { MapathonWorkspace } from "@/components/mapping/MapathonWorkspace";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Community Mapping Days & Challenges | MapAble Signal",
  description:
    "Explore MapAble Signal mapathon challenges: participatory accessibility mapping for routes, entrances, facilities, sensory access and up-to-date information.",
};

export default function MappingDaysPage() {
  return (
    <MapAbleCareMarketingShell>
      <MapathonWorkspace />
    </MapAbleCareMarketingShell>
  );
}
