import React from "react";

import { competitorContrastCards } from "@/lib/marketing/mapable-care-combined-data";

/**
 * Marketing proof strip — evidence of differentiation without “Coming soon”
 * metrics or card chrome.
 */
export function CompetitorContrastStrip() {
  return (
    <section
      aria-labelledby="contrast-heading"
      className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16"
    >
      <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
        Why MapAble
      </p>
      <h2
        id="contrast-heading"
        className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.04em] text-[#0C1833] md:text-4xl"
      >
        Accessibility proof, not another directory.
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
        MapAble publishes access detail, confidence, and practical next steps so
        participants and providers can plan with clearer evidence.
      </p>
      <ol className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
        {competitorContrastCards.map((card, index) => (
          <li
            key={card.title}
            className="grid gap-3 py-6 md:grid-cols-[7rem_minmax(0,1fr)] md:gap-8"
          >
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#005B7F]">
              {String(index + 1).padStart(2, "0")} · {card.badge}
            </p>
            <div>
              <h3 className="text-xl font-black text-[#0C1833]">
                {card.title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {card.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
