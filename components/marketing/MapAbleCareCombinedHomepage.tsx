"use client";

import React from "react";

import { BoundaryNotice } from "@/components/canvas/BoundaryNotice";
import { CompetitorContrastStrip } from "@/components/marketing/home/CompetitorContrastStrip";
import { GuidedSearchPanel } from "@/components/marketing/home/GuidedSearchPanel";
import { HeroSection } from "@/components/marketing/home/HeroSection";
import { HomepageFinalCta } from "@/components/marketing/home/HomepageFinalCta";
import { HomepageMapPreview } from "@/components/marketing/home/HomepageMapPreview";
import { HomepageProofStrip } from "@/components/marketing/home/HomepageProofStrip";
import { HomepageProviderPitch } from "@/components/marketing/home/HomepageProviderPitch";
import { HomepageSupportJourney } from "@/components/marketing/home/HomepageSupportJourney";
import { MapAbleCareMarketingHeader } from "@/components/marketing/mapable-care-shared";
import { MapAbleCareMarketingFooter } from "@/components/marketing/MapAbleCareMarketingFooter";

export { mapAbleCareCombinedDesignTests } from "@/lib/marketing/mapable-care-combined-data";
export { MapAbleCareMarketingTypography } from "@/components/marketing/MapAbleCareTypography";
export { MapAbleCareMarketingHeader } from "@/components/marketing/mapable-care-shared";
export { MapAbleCareMarketingFooter } from "@/components/marketing/MapAbleCareMarketingFooter";

export function MapAbleCareCombinedHomepageSections() {
  return (
    <>
      <HeroSection />
      <HomepageProofStrip />
      <CompetitorContrastStrip />
      <HomepageMapPreview />
      <HomepageSupportJourney />
      <HomepageProviderPitch />
      <HomepageFinalCta />
      <GuidedSearchPanel />
      <BoundaryNotice />
      <noscript>
        <div className="mx-auto max-w-7xl px-5 py-8 text-sm text-slate-700 lg:px-8">
          MapAble core pages work without JavaScript for reading and following links.
          Interactive map filters are optional enhancements.
        </div>
      </noscript>
    </>
  );
}

export default function MapAbleCareCombinedHomepage() {
  return (
    <main id="main-content" className="mapable-soft flex min-h-screen flex-col bg-white text-[#0C1833]">
      <MapAbleCareMarketingHeader />
      <MapAbleCareCombinedHomepageSections />
      <MapAbleCareMarketingFooter />
    </main>
  );
}
