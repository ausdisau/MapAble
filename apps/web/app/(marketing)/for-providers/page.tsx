import Link from "next/link";

import { CanvasBlockGrid } from "@/components/canvas/CanvasBlockGrid";
import { JourneyTimeline } from "@/components/canvas/JourneyTimeline";
import { TrustLayer } from "@/components/canvas/TrustLayer";
import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import { trustPrinciples } from "@/lib/canvas/canvas-data";
import {
  getProviderBlocks,
  getProviderJourneySteps,
} from "@/lib/canvas/canvas-filters";

export const metadata = {
  title: "For providers | MapAble",
  description:
    "Register provider interest for the MapAble controlled pilot and verification pathway.",
};

export default function ForProvidersPage() {
  const providerBlocks = getProviderBlocks();
  const providerJourney = getProviderJourneySteps();
  const providerTrustPrinciples = trustPrinciples.slice(0, 6);

  return (
    <>
      <PublicInfoPage
        eyebrow="For providers"
        title="Prepare your organisation for safer participant-facing operations."
        description="MapAble is designed for providers that need consent-aware intake, bookings, workforce eligibility, service evidence and participant review."
        ctaLabel="Register provider interest"
        ctaHref="/contact"
        sections={[
          {
            title: "What providers can do now",
            content: (
              <ul className="list-disc space-y-2 pl-5">
                <li>Register interest in the controlled pilot.</li>
                <li>
                  Explore the public provider finder and public module pages.
                </li>
                <li>Review the planned verification and safety approach.</li>
              </ul>
            ),
          },
          {
            title: "What is coming soon",
            content: (
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Organisation profiles, service regions and service catalogues.
                </li>
                <li>
                  Worker, driver, vehicle and practitioner credential tracking.
                </li>
                <li>
                  Booking inboxes, service logs, invoice evidence and audit
                  trails.
                </li>
              </ul>
            ),
          },
          {
            title: "Verification note",
            content: (
              <p>
                Provider, worker, driver and admin access will start as pending.
                Matching, booking, rostering and dispatch will depend on role,
                consent and eligibility checks.
              </p>
            ),
          },
          {
            title: "Useful links",
            content: (
              <p>
                Explore{" "}
                <Link
                  href="/providers"
                  className="font-medium text-primary hover:underline"
                >
                  providers
                </Link>
                , read the{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-primary hover:underline"
                >
                  privacy notice
                </Link>
                , or{" "}
                <Link
                  href="/contact"
                  className="font-medium text-primary hover:underline"
                >
                  contact MapAble
                </Link>
                .
              </p>
            ),
          },
        ]}
      />
      <CanvasBlockGrid
        blocks={providerBlocks}
        title="Provider ecosystem capabilities"
        id="provider-canvas-blocks"
        description="Capabilities most relevant to organisations delivering support through MapAble."
        showLinks={false}
      />
      <JourneyTimeline
        steps={providerJourney}
        compact
        id="provider-journey"
        title="Provider delivery journey"
      />
      <TrustLayer
        principles={providerTrustPrinciples}
        id="provider-trust-layer"
        showAutomationQuote={false}
      />
    </>
  );
}
