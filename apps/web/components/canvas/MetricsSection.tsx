import React from "react";

import type { MetricGroup } from "@/lib/canvas/canvas-data";
import {
  mapablePublicEyebrowClass,
  mapablePublicPageContainerClass,
} from "@/lib/marketing/public-page-styles";

type MetricsSectionProps = {
  groups: MetricGroup[];
  id?: string;
};

export function MetricsSection({
  groups,
  id = "complete-support-metrics",
}: MetricsSectionProps) {
  return (
    <section
      id={id}
      className="border-b border-slate-200 bg-white"
      aria-labelledby={`${id}-heading`}
    >
      <div className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}>
        <p className={mapablePublicEyebrowClass}>Measurable outcomes</p>
        <h2
          id={`${id}-heading`}
          className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
        >
          KPIs that reflect whole-journey support
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          Targets for product and pilot evaluation — not live dashboards on this
          page.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {groups.map((group) => (
            <article
              key={group.title}
              className="rounded-[1.5rem] border border-slate-200 bg-mapable-surface p-5"
            >
              <h3 className="text-base font-black text-mapable-navy">
                {group.title}
              </h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                {group.metrics.map((m) => (
                  <li key={m.label}>{m.label}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
