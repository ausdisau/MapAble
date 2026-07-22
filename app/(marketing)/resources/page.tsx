import Link from "next/link";
import React from "react";

import { BoundaryNotice } from "@/components/canvas/BoundaryNotice";
import { CanvasBlockGrid } from "@/components/canvas/CanvasBlockGrid";
import { JourneyTimeline } from "@/components/canvas/JourneyTimeline";
import { PolicyResourceGrid } from "@/components/canvas/PolicyResourceGrid";
import { ResourceModuleGrid } from "@/components/canvas/ResourceModuleGrid";
import { TrustLayer } from "@/components/canvas/TrustLayer";
import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import { AccessGuidesSection } from "@/components/resources/AccessGuidesSection";
import { canvasBlocks } from "@/lib/canvas/canvas-data";
import {
  getParticipantJourneySteps,
  getResourceTrustPrinciples,
} from "@/lib/canvas/canvas-filters";
import {
  policyResourceLinks,
  resourceModuleLinks,
} from "@/lib/canvas/resource-hub-data";
import { canonicalAlternate } from "@/lib/config/canonical-url";
import {
  accessGuideDownloads,
  accessGuides,
  getCapitalAccessGuides,
} from "@/lib/resources/access-guides-data";

export const metadata = {
  title: "Resources | MapAble",
  description:
    "MapAble resource hub for Access Guides, modules, ecosystem canvas, policy links, and support pathways.",
  alternates: canonicalAlternate("/resources"),
};

export default function ResourcesPage() {
  const participantJourney = getParticipantJourneySteps();
  const resourceTrustPrinciples = getResourceTrustPrinciples();
  const capitalGuides = getCapitalAccessGuides();
  const regionalCount = accessGuides.length - capitalGuides.length;

  return (
    <>
      <PublicInfoPage
        eyebrow="Resource hub"
        title="Practical resources for the MapAble pilot."
        description="Explore Access Guides for Australian cities, public modules, the Complete Support ecosystem, policy documents, and support pathways while the operating system is prepared for controlled pilots."
        ctaLabel="Browse Access Guides"
        ctaHref="#access-guides"
        sections={[
          {
            title: "Access Guides",
            content: (
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <Link
                    href="#access-guides"
                    className="font-medium text-primary hover:underline"
                  >
                    Capital city starter guides
                  </Link>{" "}
                  for Canberra, Sydney, Melbourne, Brisbane, Adelaide, Perth,
                  Hobart and Darwin.
                </li>
                <li>
                  <a
                    href={accessGuideDownloads.pdf}
                    download
                    className="font-medium text-primary hover:underline"
                  >
                    Download the Australia Accessibility Guides pack (PDF)
                  </a>{" "}
                  or{" "}
                  <a
                    href={accessGuideDownloads.docx}
                    download
                    className="font-medium text-primary hover:underline"
                  >
                    Word (.docx)
                  </a>
                  .
                </li>
                <li>
                  <Link
                    href="/guides"
                    className="font-medium text-primary hover:underline"
                  >
                    Full Access Guides directory
                  </Link>{" "}
                  including {regionalCount} regional Tier 1–3 locations.
                </li>
              </ul>
            ),
          },
          {
            title: "Participant resources",
            content: (
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <Link
                    href="/care"
                    className="font-medium text-primary hover:underline"
                  >
                    MapAble Care
                  </Link>{" "}
                  for consent-first support requests and access-fit matching.
                </li>
                <li>
                  <Link
                    href="/transport"
                    className="font-medium text-primary hover:underline"
                  >
                    MapAble Transport
                  </Link>{" "}
                  for accessible trip planning and care + transport bundles.
                </li>
                <li>
                  <Link
                    href="/access"
                    className="font-medium text-primary hover:underline"
                  >
                    MapAble Access
                  </Link>{" "}
                  for participant-controlled access notes and venue profiles.
                </li>
                <li>
                  <Link
                    href="/providers"
                    className="font-medium text-primary hover:underline"
                  >
                    Provider finder
                  </Link>{" "}
                  for public provider discovery.
                </li>
              </ul>
            ),
          },
          {
            title: "Provider resources",
            content: (
              <p>
                Provider onboarding, verification, and workforce controls are
                being prepared for pilot use.{" "}
                <Link
                  href="/for-providers"
                  className="font-medium text-primary hover:underline"
                >
                  Register provider interest
                </Link>{" "}
                and review the provider journey and capability blocks below.
              </p>
            ),
          },
          {
            title: "Pilot and support resources",
            content: (
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <Link
                    href="/about"
                    className="font-medium text-primary hover:underline"
                  >
                    About MapAble
                  </Link>{" "}
                  for platform principles, roadmap, and ecosystem overview.
                </li>
                <li>
                  <Link
                    href="/help"
                    className="font-medium text-primary hover:underline"
                  >
                    Help centre
                  </Link>{" "}
                  for Rights Navigator and complaint pathways.
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="font-medium text-primary hover:underline"
                  >
                    Contact MapAble
                  </Link>{" "}
                  for pilot enquiries and feedback.
                </li>
              </ul>
            ),
          },
        ]}
      />
      <AccessGuidesSection
        capitalGuides={capitalGuides}
        regionalCount={regionalCount}
      />
      <ResourceModuleGrid modules={resourceModuleLinks} />
      <CanvasBlockGrid
        blocks={canvasBlocks}
        title="Complete Support ecosystem reference"
        id="resource-canvas-blocks"
        description="All twelve connected capabilities in one place — use this hub to understand how care, transport, access, and trust fit together."
        showLinks
      />
      <JourneyTimeline
        steps={participantJourney}
        compact
        id="participant-journey"
        title="Participant support journey"
      />
      <PolicyResourceGrid links={policyResourceLinks} />
      <TrustLayer
        principles={resourceTrustPrinciples}
        id="resource-trust-layer"
        showAutomationQuote={false}
      />
      <BoundaryNotice />
    </>
  );
}
