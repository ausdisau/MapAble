import Link from "next/link";
import type { Metadata } from "next";
import React from "react";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export const metadata: Metadata = {
  title: "Why MapAble is different | Compare",
  description:
    "MapAble connects access information, providers, transport, support coordination, and evidence-backed venue details.",
};

const rows = [
  ["Provider search", "Often yes", "Rarely", "Yes"],
  ["Accessibility reviews", "Limited", "Often yes", "Yes"],
  ["Exact access measurements", "Rarely", "Sometimes", "Yes"],
  ["Confidence / last checked", "Rarely", "Sometimes", "Yes"],
  ["Live provider availability", "Sometimes", "No", "Designed for"],
  ["Transport planning", "Rarely", "Rarely", "Yes"],
  ["Care + transport booking", "Rarely", "No", "Yes"],
  ["Support coordinator sharing", "Rarely", "No", "Yes"],
  ["Venue verification", "Rarely", "Limited", "Yes"],
  ["Community mapping", "Rarely", "Often yes", "Yes"],
  ["NDIS-aware request flow", "Sometimes", "No", "Yes"],
  ["List-view map alternative", "Often yes", "Sometimes missing", "Yes"],
] as const;

const useCases = [
  "I need to know if I can enter a place",
  "I need a provider with no waitlist",
  "I need transport to the appointment",
  "I need a support worker to meet me there",
  "I run a venue and want better access info",
  "I am a support coordinator planning an outing",
];

export default function ComparePage() {
  return (
    <MapAbleCareMarketingShell>
      <div className="bg-white text-[#0C1833]">
        <section className="border-b border-slate-200 bg-[#F6FBFC]">
          <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
              Why MapAble is different
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.04em] md:text-6xl">
              More than a directory. More than a map.
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-slate-600">
              MapAble connects access information, providers, transport, support coordination,
              and evidence-backed venue details. This comparison respects other tools and avoids
              false claims.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8" aria-labelledby="compare-table-heading">
          <h2 id="compare-table-heading" className="text-2xl font-black">
            Feature comparison
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Columns describe typical provider directories and typical accessibility maps, not a
            named competitor attack.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Comparison of features across provider directories, accessibility maps, and MapAble
              </caption>
              <thead>
                <tr className="border-b border-slate-300">
                  <th scope="col" className="px-3 py-3 font-black">
                    Feature
                  </th>
                  <th scope="col" className="px-3 py-3 font-black">
                    Provider directory
                  </th>
                  <th scope="col" className="px-3 py-3 font-black">
                    Accessibility map
                  </th>
                  <th scope="col" className="px-3 py-3 font-black">
                    MapAble
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([feature, directory, map, mapable]) => (
                  <tr key={feature} className="border-b border-slate-200">
                    <th scope="row" className="px-3 py-3 font-semibold">
                      {feature}
                    </th>
                    <td className="px-3 py-3">{directory}</td>
                    <td className="px-3 py-3">{map}</td>
                    <td className="px-3 py-3 font-semibold text-[#005B7F]">{mapable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-12 lg:px-8" aria-labelledby="use-cases-heading">
          <h2 id="use-cases-heading" className="text-2xl font-black">
            Use cases
          </h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {useCases.map((item) => (
              <li key={item} className="rounded-2xl border border-slate-200 p-4 font-semibold">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-[#0C1833] px-5 py-12 text-white lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-black">Next steps</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <Cta href="/accessibility-map" label="Find accessible places" primary />
              <Cta href="/care/request" label="Request support" />
              <Cta href="/verify-my-venue" label="Verify my venue" />
              <Cta href="/mapping-days" label="Join a mapping day" />
            </div>
          </div>
        </section>
      </div>
    </MapAbleCareMarketingShell>
  );
}

function Cta({
  href,
  label,
  primary,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? `inline-flex min-h-11 items-center rounded-xl bg-[#F8C51C] px-4 text-sm font-black text-[#0C1833] ${mapableCareFocusRing}`
          : `inline-flex min-h-11 items-center rounded-xl border border-white/40 px-4 text-sm font-black ${mapableCareFocusRing}`
      }
    >
      {label}
    </Link>
  );
}
