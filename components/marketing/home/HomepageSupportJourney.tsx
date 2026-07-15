import React from "react";
import { homepageSupportJourneySteps } from "@/lib/marketing/mapable-care-combined-data";

export function HomepageSupportJourney() {
  return (
    <section
      aria-labelledby="support-journey-heading"
      className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16"
    >
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
        Support journey
      </p>
      <h2
        id="support-journey-heading"
        className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.04em] text-[#0C1833] md:text-4xl"
      >
        From finding a place to confirming the visit.
      </h2>
      <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {homepageSupportJourneySteps.map((step) => (
          <li
            key={step.number}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#005B7F]">
              Step {step.number}
            </p>
            <h3 className="mt-2 text-xl font-black text-[#0C1833]">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
