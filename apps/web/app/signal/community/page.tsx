import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SignalCommunityStudio } from "@/components/signal/SignalCommunityStudio";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { isSignalCommunityDemoEnabled } from "@/lib/signal/community/engine";

export const metadata: Metadata = {
  title: "Community Forum & Accessibility Survey | MapAble Signal (Preview)",
  description:
    "A consent-first preview of community discussions and structured accessibility surveys, based on MapAble's existing FormHug questionnaire.",
};

export const dynamic = "force-dynamic";

/**
 * The preview is inaccessible on the production deployment even if its
 * environment flag is mistakenly enabled. No FormHug entries or personal
 * accounts are fetched, and no writes are sent to external services.
 */
export default function MapAbleSignalCommunityPage() {
  if (!isSignalCommunityDemoEnabled()) notFound();

  return (
    <MapAbleCareMarketingShell>
      <SignalCommunityStudio />
    </MapAbleCareMarketingShell>
  );
}
