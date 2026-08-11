import type { Metadata } from "next";
import Link from "next/link";

import { DecisionPassportPanel } from "@/components/navigator/DecisionPassportPanel";
import { isNavigatorPilotEnabled } from "@/lib/config/navigator-pilot";

export const metadata: Metadata = {
  title: "Navigator pilot — Decision Passport",
  description:
    "Participant controls for the MapAble Navigator governed pilot: correct, reject, opt out of AI, or request human help.",
};

export default function NavigatorPilotPage() {
  const enabled = isNavigatorPilotEnabled();

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[linear-gradient(180deg,#F3F7FA_0%,#E7EEF3_100%)] px-4 py-10 text-[#0C1833]"
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-3">
          <p className="text-sm font-semibold tracking-wide text-[#1B4F72]">
            MapAble
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Navigator pilot
          </h1>
          <p className="max-w-prose text-base leading-relaxed text-[#334155]">
            A quiet place to review what Navigator understood and keep control
            of the next step. No booking or payment happens here.
          </p>
        </header>

        {!enabled ? (
          <section
            aria-labelledby="pilot-disabled-heading"
            className="rounded-lg border border-[#C5D5E0] bg-white p-6"
          >
            <h2
              id="pilot-disabled-heading"
              className="text-lg font-semibold text-[#0C1833]"
            >
              Navigator pilot is not enabled
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#334155]">
              This governed pilot surface is turned off in this environment.
              You can still find providers using the classic Provider Finder —
              no AI assistance required.
            </p>
            <p className="mt-4">
              <Link
                href="/provider-finder"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#1B4F72] px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72]"
              >
                Continue to Provider Finder
              </Link>
            </p>
          </section>
        ) : (
          <DecisionPassportPanel />
        )}
      </div>
    </main>
  );
}
