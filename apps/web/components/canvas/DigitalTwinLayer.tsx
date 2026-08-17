import React from "react";

import type { DigitalTwinCard } from "@/lib/canvas/canvas-data";
import { digitalTwinMicrocopy } from "@/lib/canvas/canvas-data";
import {
  mapablePublicEyebrowClass,
  mapablePublicPageContainerClass,
} from "@/lib/marketing/public-page-styles";

type DigitalTwinLayerProps = {
  cards: DigitalTwinCard[];
  id?: string;
};

export function DigitalTwinLayer({
  cards,
  id = "digital-twin-layer",
}: DigitalTwinLayerProps) {
  return (
    <section
      id={id}
      className="border-b border-slate-200 bg-mapable-surface"
      aria-labelledby={`${id}-heading`}
    >
      <div className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}>
        <p className={mapablePublicEyebrowClass}>Digital twin layer</p>
        <h2
          id={`${id}-heading`}
          className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
        >
          Support happens somewhere
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          {digitalTwinMicrocopy}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.25rem] border border-slate-200 bg-white p-4"
            >
              <h3 className="text-sm font-black text-mapable-navy">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
