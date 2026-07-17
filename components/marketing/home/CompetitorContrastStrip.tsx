import React from "react";

import { competitorContrastCards } from "@/lib/marketing/mapable-care-combined-data";

export function CompetitorContrastStrip() {
  return (
    <section
      aria-labelledby="contrast-heading"
      className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16"
    >
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
        Why MapAble is different
      </p>
      <h2
        id="contrast-heading"
        className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.04em] text-[#0C1833] md:text-4xl"
      >
        More useful than a directory or a traffic-light map alone.
      </h2>
      <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {competitorContrastCards.map((card) => (
          <li
            key={card.title}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#005B7F]">
              {card.badge}
            </p>
            <h3 className="mt-3 text-xl font-black text-[#0C1833]">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{card.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
