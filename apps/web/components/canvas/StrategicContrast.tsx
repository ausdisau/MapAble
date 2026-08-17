import React from "react";

import {
  careOnlyPlatformItems,
  mapableCompleteSupportItems,
} from "@/lib/canvas/canvas-data";
import {
  mapablePublicEyebrowClass,
  mapablePublicPageContainerClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";

export function StrategicContrast() {
  return (
    <section
      id="complete-support-contrast"
      className="border-y border-slate-200 bg-white"
      aria-labelledby="strategic-contrast-heading"
    >
      <div className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}>
        <p className={mapablePublicEyebrowClass}>Strategic contrast</p>
        <h2
          id="strategic-contrast-heading"
          className={`${mapablePublicSectionTitleClass} mt-2 text-2xl font-black normal-case tracking-tight text-mapable-navy sm:text-3xl`}
        >
          Care-only platform vs MapAble Complete Support
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Comparison is by capability, not colour. Both columns list what each
          model includes.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <article
            className="rounded-[1.5rem] border-2 border-slate-200 bg-slate-50 p-6"
            aria-labelledby="care-only-heading"
          >
            <h3
              id="care-only-heading"
              className="text-lg font-black text-slate-800"
            >
              Care-only platform
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Typical worker marketplace scope
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
              {careOnlyPlatformItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article
            className="rounded-[1.5rem] border-2 border-mapable-brand bg-mapable-surface p-6"
            aria-labelledby="mapable-complete-heading"
          >
            <h3
              id="mapable-complete-heading"
              className="text-lg font-black text-mapable-navy"
            >
              MapAble Complete Support
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Operating system for accessible support delivery
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
              {mapableCompleteSupportItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
