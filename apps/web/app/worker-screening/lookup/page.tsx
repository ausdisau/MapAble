import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NdiswcLookupGuide } from "@/components/workers/NdiswcLookupGuide";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "NDIS Worker Screening — Australian official lookup pathways | MapAble",
  description: "Find the right state, territory and national worker-screening portal. Guidance only: no public worker status search or clearance verification.",
  robots: { index: false, follow: false },
};

export default function NdiswcLookupPage() {
  // Explicit launch control. No person-specific data exists in the feature.
  if (process.env.MAPABLE_NDISWC_GUIDE_ENABLED !== "true") {
    notFound();
  }
  return (
    <main id="main-content"
      className="mx-auto min-h-screen max-w-6xl bg-[#f2f6f8] px-4 py-8 text-[#10283b] sm:px-8">
      <NdiswcLookupGuide />
    </main>
  );
}
