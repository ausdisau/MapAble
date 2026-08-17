import type { Metadata } from "next";
import React from "react";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export const metadata: Metadata = {
  title: "Access Intelligence | MapAble",
  description:
    "Aggregated accessibility intelligence for councils, venues, tourism, transport partners, and disability organisations.",
};

const cards = [
  { label: "Mapped places", value: "Pilot target" },
  { label: "Unknown access records", value: "Demo" },
  { label: "Top reported barriers", value: "Demo" },
  { label: "Suburbs with low access confidence", value: "Coming soon" },
  { label: "Accessible toilet gaps", value: "Demo" },
  { label: "Transport access gaps", value: "Coming soon" },
  { label: "Venue verification pipeline", value: "Demo" },
  { label: "Community mapping progress", value: "Pilot target" },
];

const reports = [
  "Council accessibility scorecard",
  "Accessible tourism readiness report",
  "Venue improvement pipeline",
  "Provider access-readiness report",
  "Transport barrier summary",
];

export default function AccessIntelligencePage() {
  return (
    <MapAbleCareMarketingShell>
      <div className="bg-white text-[#0C1833]">
        <section className="border-b border-slate-200 bg-[#F6FBFC]">
          <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
            <h1 className="max-w-4xl text-4xl font-black tracking-[-0.04em] md:text-5xl">
              Access intelligence for places and precincts
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-slate-600">
              A B2B/B2G preview for councils, venues, tourism bodies, transport partners, and
              disability organisations. Demo metrics only.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-12 px-5 py-12 lg:px-8">
          <section aria-labelledby="cards-heading">
            <h2 id="cards-heading" className="text-2xl font-black">
              Dashboard cards
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => (
                <li key={card.label} className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-2xl font-black">{card.value}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{card.label}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="reports-heading">
            <h2 id="reports-heading" className="text-2xl font-black">
              Report types
            </h2>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {reports.map((report) => (
                <li key={report} className="rounded-xl border border-slate-200 p-4 font-semibold">
                  {report}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="ethics-heading" className="rounded-2xl bg-slate-50 p-6">
            <h2 id="ethics-heading" className="text-xl font-black">
              Data ethics
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>Aggregated only</li>
              <li>No identifiable disability or health data</li>
              <li>Minimum aggregation threshold</li>
              <li>Transparent methodology</li>
              <li>Lived-experience review</li>
            </ul>
          </section>

          <section>
            <a
              href="/contact"
              className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-5 text-sm font-black text-white ${mapableCareFocusRing}`}
            >
              Request an access intelligence briefing
            </a>
          </section>
        </div>
      </div>
    </MapAbleCareMarketingShell>
  );
}
