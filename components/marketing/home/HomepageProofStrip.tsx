import React from "react";
import { homepageProofMetrics } from "@/lib/marketing/mapable-care-combined-data";

export function HomepageProofStrip() {
  return (
    <section
      aria-labelledby="proof-strip-heading"
      className="border-y border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <h2 id="proof-strip-heading" className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
          Honest progress signals
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          These labels describe pilot targets and demo readiness. They are not live proof counts.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {homepageProofMetrics.map((metric) => (
            <li
              key={metric.label}
              className="rounded-[1.4rem] border border-slate-200 bg-[#F6FBFC] p-5"
            >
              <p className="text-2xl font-black tracking-[-0.03em] text-[#0C1833]">
                {metric.value}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{metric.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
