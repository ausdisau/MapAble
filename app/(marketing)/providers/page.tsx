import type { Metadata } from "next";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { ProviderDirectory } from "@/components/providers/ProviderDirectory";

export const metadata: Metadata = {
  title: "Providers | MapAble",
  description:
    "Find disability support providers with availability, access-readiness, transport feasibility, and evidence status.",
};

export default function ProvidersPage() {
  return (
    <MapAbleCareMarketingShell>
      <ProviderDirectory />
    </MapAbleCareMarketingShell>
  );
}
