import React from "react";

import { CanvasBlockCard } from "@/components/canvas/CanvasBlockCard";
import type { CanvasBlock } from "@/lib/canvas/canvas-data";
import {
  mapablePublicEyebrowClass,
  mapablePublicPageContainerClass,
} from "@/lib/marketing/public-page-styles";

type CanvasBlockGridProps = {
  blocks: CanvasBlock[];
  title?: string;
  id?: string;
  description?: string;
  showLinks?: boolean;
};

export function CanvasBlockGrid({
  blocks,
  title = "Complete Support ecosystem",
  id = "complete-support-ecosystem",
  description = "Twelve connected capabilities that turn support booking into whole-journey delivery.",
  showLinks = true,
}: CanvasBlockGridProps) {
  return (
    <section
      id={id}
      className="border-b border-slate-200 bg-white"
      aria-labelledby={`${id}-heading`}
    >
      <div className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}>
        <p className={mapablePublicEyebrowClass}>Ecosystem canvas</p>
        <h2
          id={`${id}-heading`}
          className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            {description}
          </p>
        ) : null}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blocks.map((block) => (
            <CanvasBlockCard key={block.id} block={block} showLink={showLinks} />
          ))}
        </div>
      </div>
    </section>
  );
}
