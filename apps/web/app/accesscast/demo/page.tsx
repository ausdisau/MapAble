import type { Metadata } from "next";
import Link from "next/link";

import { AccessCastCard } from "@/components/accesscast/AccessCastCard";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import {
  accessCastFlags,
  forecastHarbourPlaceOutlook,
  forecastStartingWorkJourney,
} from "@/lib/accesscast";

export const metadata: Metadata = {
  title: "AccessCast demo (synthetic) | MapAble Access Weather",
  description:
    "Synthetic Access Weather outlook for Harbour Civic Centre — not a production claim.",
};

export default function AccessCastDemoPage() {
  const enabled = accessCastFlags.enabled && accessCastFlags.allowSyntheticExecution;

  if (!enabled) {
    return (
      <MapAbleCareMarketingShell>
        <main className="mx-auto max-w-3xl px-5 py-12">
          <h1 className="text-3xl font-black tracking-tight">Access Weather (AccessCast)</h1>
          <p className="mt-4 text-slate-600">
            Enable{" "}
            <code className="rounded bg-slate-100 px-1">MAPABLE_ACCESSCAST_ENABLED=true</code> with
            mode{" "}
            <code className="rounded bg-slate-100 px-1">synthetic</code> (default) to view the
            synthetic Harbour AccessCast demo.
          </p>
          <p className="mt-4 text-slate-600">Know before you go.</p>
        </main>
      </MapAbleCareMarketingShell>
    );
  }

  const place = forecastHarbourPlaceOutlook({ scenarioId: "harbour_place_baseline" });
  const journey = accessCastFlags.journeyOutlook
    ? forecastStartingWorkJourney({ scenarioId: "starting_work_tomorrow" })
    : null;

  return (
    <MapAbleCareMarketingShell>
      <main className="mx-auto max-w-4xl space-y-12 px-5 py-12">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
            AccessCast — synthetic / documentation only
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">MapAble Access Weather</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Know before you go. Accessibility outlook for a selected place or journey at the intended
            time — composed from Access Intelligence Next Harbour fixtures. Not a safety guarantee.
          </p>
          <p className="mt-2">
            <Link className="text-sky-800 underline" href="/access-intelligence">
              Access Intelligence Next
            </Link>
          </p>
        </div>

        <AccessCastCard result={place} showTimeline={accessCastFlags.timeline} />

        {journey ? (
          <section aria-labelledby="starting-work-cast">
            <h2 id="starting-work-cast" className="mb-4 text-2xl font-bold">
              Starting Work journey outlook
            </h2>
            <AccessCastCard result={journey} showTimeline={accessCastFlags.timeline} />
          </section>
        ) : (
          <p className="text-sm text-slate-600">
            Enable{" "}
            <code className="rounded bg-slate-100 px-1">
              MAPABLE_ACCESSCAST_JOURNEY_OUTLOOK_ENABLED
            </code>{" "}
            to show the Starting Work journey AccessCast.
          </p>
        )}
      </main>
    </MapAbleCareMarketingShell>
  );
}
