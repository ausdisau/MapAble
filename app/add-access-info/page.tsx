import type { Metadata } from "next";

import { AddAccessInfoForm } from "@/components/mapping/AddAccessInfoForm";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Add Access Info | MapAble",
  description:
    "Submit community access details for places with confidence labels, consent, and safer photo guidelines.",
};

export default function AddAccessInfoPage() {
  return (
    <MapAbleCareMarketingShell>
      <AddAccessInfoForm />
    </MapAbleCareMarketingShell>
  );
}
