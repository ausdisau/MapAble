import React from "react";

import type { JourneyStep } from "@/lib/canvas/canvas-data";
import {
  mapablePublicEyebrowClass,
  mapablePublicPageContainerClass,
} from "@/lib/marketing/public-page-styles";

type JourneyTimelineProps = {
  steps: JourneyStep[];
  compact?: boolean;
  id?: string;
  title?: string;
};

export function JourneyTimeline({
  steps,
  compact = false,
  id = "complete-support-journey",
  title = "End-to-end support journey",
}: JourneyTimelineProps) {
  return (
    <section
      id={id}
      className="border-b border-slate-200 bg-mapable-surface"
      aria-labelledby={`${id}-heading`}
    >
      <div className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}>
        <p className={mapablePublicEyebrowClass}>Support journey</p>
        <h2
          id={`${id}-heading`}
          className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
        >
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          From Access Pass to coordinator outcome — twelve steps that connect
          care, transport, confirmation, and improvement.
        </p>
        <ol
          className={
            compact
              ? "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "mt-8 space-y-4"
          }
          aria-label="Support journey steps"
        >
          {steps.map((step) => (
            <li
              key={step.step}
              className="rounded-[1.25rem] border border-slate-200 bg-white p-4"
            >
              <span className="text-xs font-black uppercase tracking-wider text-mapable-brand">
                Step {step.step}
              </span>
              <h3 className="mt-1 text-base font-black text-mapable-navy">
                {step.title}
              </h3>
              {!compact ? (
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              ) : (
                <p className="mt-1 text-sm leading-6 text-slate-600 line-clamp-2">
                  {step.description}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
