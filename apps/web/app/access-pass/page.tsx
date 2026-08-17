import type { Metadata } from "next";

import { AccessPassDemo } from "@/components/access-pass/AccessPassDemo";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Access Pass | MapAble",
  description:
    "Share your access needs once, on your terms, with consent controls and role-based sharing previews.",
};

export default function AccessPassPage() {
  return (
    <MapAbleCareMarketingShell>
      <AccessPassDemo />
    </MapAbleCareMarketingShell>
  );
}
