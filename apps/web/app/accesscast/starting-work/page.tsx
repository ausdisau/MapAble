import type { Metadata } from "next";
import Link from "next/link";

import { AccessCastCard } from "@/components/accesscast/AccessCastCard";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { accessCastFlags, forecastStartingWorkJourney } from "@/lib/accesscast";

export const metadata: Metadata = {
  title: "Starting Work AccessCast | MapAble Access Weather",
  description:
    "Synthetic Starting Work journey outlook — Home to Harbour Civic Room 3.12.",
};

export default function StartingWorkAccessCastPage() {
  const enabled =
    accessCastFlags.enabled &&
    accessCastFlags.allowSyntheticExecution &&
    accessCastFlags.journeyOutlook;

  if (!enabled) {
    return (
      <MapAbleCareMarketingShell>
        <main className="mx-auto max-w-3xl px-5 py-12">
          <h1 className="text-3xl font-black tracking-tight">Starting Work AccessCast</h1>
          <p className="mt-4 text-slate-600">
            Enable{" "}
            <code className="rounded bg-slate-100 px-1">MAPABLE_ACCESSCAST_ENABLED</code>,{" "}
            <code className="rounded bg-slate-100 px-1">
              MAPABLE_ACCESSCAST_JOURNEY_OUTLOOK_ENABLED
            </code>
            , and synthetic mode to view this journey outlook.
          </p>
          <p className="mt-4">
            <Link className="text-sky-800 underline" href="/accesscast/demo">
              AccessCast demo
            </Link>
          </p>
        </main>
      </MapAbleCareMarketingShell>
    );
  }

  const result = forecastStartingWorkJourney({ scenarioId: "starting_work_tomorrow" });

  return (
    <MapAbleCareMarketingShell>
      <main className="mx-auto max-w-4xl space-y-8 px-5 py-12">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
            Synthetic Starting Work journey — not a production claim
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Journey Access Outlook
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Full door-to-room journey including return fragility, confirmation tasks, and an
            accessible timeline. Know before you go.
          </p>
        </div>
        <AccessCastCard result={result} showTimeline />
      </main>
    </MapAbleCareMarketingShell>
  );
}
