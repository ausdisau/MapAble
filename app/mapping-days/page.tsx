import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export const metadata: Metadata = {
  title: "Mapping Days | MapAble",
  description:
    "Join community mapping days to collect evidence-based access information across Australian suburbs.",
};

const events = [
  {
    title: "Parramatta civic precinct mapping",
    when: "Sat 18 Jul 2026 · 10:00–13:00",
    where: "Parramatta",
  },
  {
    title: "Newcastle harbour access check-in",
    when: "Sun 26 Jul 2026 · 09:30–12:30",
    where: "Newcastle",
  },
  {
    title: "Southbank sensory venue day",
    when: "Sat 8 Aug 2026 · 11:00–14:00",
    where: "Melbourne",
  },
];

export default function MappingDaysPage() {
  return (
    <MapAbleCareMarketingShell>
      <div className="bg-white text-[#0C1833]">
        <section className="border-b border-slate-200 bg-[#F6FBFC]">
          <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
              Community mapping
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.04em] md:text-5xl">
              Map access together — carefully, clearly, and locally.
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-slate-600">
              Mapping Days use Wheelmap-style community participation with MapAble-specific,
              Australian, evidence-based guidelines and safer photo practices.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-10 px-5 py-12 lg:px-8">
          <section aria-labelledby="upcoming-heading">
            <h2 id="upcoming-heading" className="text-2xl font-black">
              Upcoming events (demo)
            </h2>
            <ul className="mt-4 grid gap-4 md:grid-cols-3">
              {events.map((event) => (
                <li key={event.title} className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-black">{event.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{event.when}</p>
                  <p className="text-sm text-slate-600">{event.where}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="challenge-heading" className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 id="challenge-heading" className="text-xl font-black">
                Start a suburb challenge
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Pick a suburb, list priority venue types, and invite neighbours to add measured
                details with clear confidence labels.
              </p>
              <Link
                href="/add-access-info"
                className={`mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableCareFocusRing}`}
              >
                Add access info
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-xl font-black">Partner with council / university / community</h2>
              <p className="mt-2 text-sm text-slate-600">
                Organisations can co-host mapping days and contribute to local access intelligence
                reports without sharing identifiable disability data.
              </p>
              <Link
                href="/contact"
                className={`mt-4 inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
              >
                Partner with MapAble
              </Link>
            </div>
          </section>

          <section aria-labelledby="safety-heading" className="rounded-2xl bg-[#F6FBFC] p-6">
            <h2 id="safety-heading" className="text-xl font-black">
              Safety and privacy guidelines
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>Do not trespass. Stay in publicly accessible areas unless invited.</li>
              <li>Do not photograph people without consent. Prefer empty-space access photos.</li>
              <li>Be respectful to staff and explain why you are collecting access notes.</li>
              <li>Measurements help, but estimates are welcome when labelled clearly.</li>
              <li>Never publish private addresses of individuals as community access data.</li>
            </ul>
          </section>
        </div>
      </div>
    </MapAbleCareMarketingShell>
  );
}
