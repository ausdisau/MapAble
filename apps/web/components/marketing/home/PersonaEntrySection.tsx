import Link from "next/link";
import React from "react";

import { ArrowIcon } from "@/components/marketing/mapable-care-icons";
import { personaEntries } from "@/lib/marketing/mapable-care-combined-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function PersonaEntrySection() {
  return (
    <section aria-labelledby="persona-entry-heading" className="bg-[#F6FBFC]">
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
          Start with your role
        </p>
        <h2
          id="persona-entry-heading"
          className="mt-3 text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#0C1833] md:text-4xl"
        >
          Choose the pathway that fits you
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
          MapAble meets people where they are — participants, carers, coordinators, providers and
          employers can each start with a clear next step.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {personaEntries.map((entry) => (
            <li key={entry.title}>
              <Link
                href={entry.href}
                className={`flex min-h-[3rem] flex-col rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none ${mapableCareFocusRing}`}
              >
                <h3 className="text-lg font-black text-[#0C1833]">{entry.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{entry.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#005B7F]">
                  {entry.cta} <ArrowIcon />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
