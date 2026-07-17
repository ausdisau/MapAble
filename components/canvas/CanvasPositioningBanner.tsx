import React from "react";

import { positioningLines } from "@/lib/canvas/canvas-data";
import {
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
} from "@/lib/marketing/public-page-styles";

type CanvasPositioningBannerProps = {
  variant?: "default" | "module";
  moduleLabel?: string;
};

export function CanvasPositioningBanner({
  variant = "default",
  moduleLabel,
}: CanvasPositioningBannerProps) {
  return (
    <section
      className="border-b border-slate-200 bg-[#F6FBFC]"
      aria-labelledby="canvas-positioning-heading"
    >
      <div className={`${mapablePublicPageContainerClass} py-10 sm:py-12`}>
        <p className={mapablePublicEyebrowClass}>MapAble Complete Support</p>
        <h2
          id="canvas-positioning-heading"
          className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
        >
          {variant === "module" && moduleLabel
            ? `${moduleLabel} is part of the whole journey`
            : positioningLines.thesis}
        </h2>
        <p className={`${mapablePublicLeadClass} mt-3 max-w-4xl`}>
          {positioningLines.contrast}
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">
          {positioningLines.supporting}
        </p>
      </div>
    </section>
  );
}
