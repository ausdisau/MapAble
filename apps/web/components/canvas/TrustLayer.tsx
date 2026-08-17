import React from "react";

import type { TrustPrinciple } from "@/lib/canvas/canvas-data";
import { trustAutomationQuote } from "@/lib/canvas/canvas-data";
import {
  mapablePublicEyebrowClass,
  mapablePublicPageContainerClass,
} from "@/lib/marketing/public-page-styles";

type TrustLayerProps = {
  principles: TrustPrinciple[];
  showAutomationQuote?: boolean;
  id?: string;
};

export function TrustLayer({
  principles,
  showAutomationQuote = true,
  id = "trust-layer",
}: TrustLayerProps) {
  return (
    <section
      id={id}
      className="border-b border-slate-200 bg-white"
      aria-labelledby={`${id}-heading`}
    >
      <div className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}>
        <p className={mapablePublicEyebrowClass}>Trust layer</p>
        <h2
          id={`${id}-heading`}
          className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
        >
          Trust is the product
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((p) => (
            <article
              key={p.title}
              className="rounded-[1.5rem] border border-slate-200 bg-mapable-surface p-5"
            >
              <h3 className="text-base font-black text-mapable-navy">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{p.description}</p>
            </article>
          ))}
        </div>
        {showAutomationQuote ? (
          <blockquote className="mt-8 rounded-[1.25rem] border-l-4 border-mapable-brand bg-slate-50 p-5 text-base leading-7 text-slate-700">
            {trustAutomationQuote}
          </blockquote>
        ) : null}
      </div>
    </section>
  );
}
