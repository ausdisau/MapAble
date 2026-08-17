import React from "react";

import type { RoadmapPhase } from "@/lib/canvas/canvas-data";
import {
  mapablePublicEyebrowClass,
  mapablePublicPageContainerClass,
} from "@/lib/marketing/public-page-styles";

type RoadmapPhasesProps = {
  phases: RoadmapPhase[];
  id?: string;
};

export function RoadmapPhases({
  phases,
  id = "complete-support-roadmap",
}: RoadmapPhasesProps) {
  return (
    <section
      id={id}
      className="border-b border-slate-200 bg-mapable-surface"
      aria-labelledby={`${id}-heading`}
    >
      <div className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}>
        <p className={mapablePublicEyebrowClass}>Build roadmap</p>
        <h2
          id={`${id}-heading`}
          className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
        >
          Three phases to beat the category
        </h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {phases.map((phase) => (
            <article
              key={phase.phase}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
            >
              <p className="text-xs font-black uppercase tracking-wider text-mapable-brand">
                {phase.phase}
              </p>
              <h3 className="mt-2 text-lg font-black text-mapable-navy">
                {phase.title}
              </h3>
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                {phase.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
