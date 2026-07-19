import Link from "next/link";
import React from "react";

import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
} from "@/lib/marketing/public-page-styles";
import type { AccessGuide } from "@/lib/resources/access-guides-data";
import { accessGuideDownloads } from "@/lib/resources/access-guides-data";

type AccessGuidesSectionProps = {
  capitalGuides: AccessGuide[];
  regionalCount: number;
  title?: string;
  id?: string;
};

function statusLabel(guide: AccessGuide): string {
  switch (guide.statusKey) {
    case "drafted":
      return "Starter guide drafted";
    case "needs_verification":
      return "Needs local verification";
    case "planned":
      return "Planned";
    default: {
      const _exhaustive: never = guide.statusKey;
      return _exhaustive;
    }
  }
}

export function AccessGuidesSection({
  capitalGuides,
  regionalCount,
  title = "Access Guides for Australia",
  id = "access-guides",
}: AccessGuidesSectionProps) {
  return (
    <section
      id={id}
      className="border-b border-slate-200 bg-[#F6FBFC]"
      aria-labelledby={`${id}-heading`}
    >
      <div className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}>
        <p className={mapablePublicEyebrowClass}>Access Guides</p>
        <h2
          id={`${id}-heading`}
          className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
        >
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Practical city and regional accessibility guides covering transport,
          toilets, gradients, crowd alternatives, and day-planning — starting
          with capital cities, then Tier 1–3 regional locations.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={accessGuideDownloads.pdf}
            download
            className={mapablePublicPrimaryButtonClass}
          >
            Download guides pack (PDF)
          </a>
          <a
            href={accessGuideDownloads.docx}
            download
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            Download Word (.docx)
          </a>
          <a
            href={accessGuideDownloads.rolloutMatrix}
            download
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            Rollout matrix (CSV)
          </a>
          <Link
            href="/guides"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            Browse all guides
          </Link>
        </div>

        <h3 className="mt-10 text-lg font-black text-[#0C1833]">
          Capital city starter guides
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capitalGuides.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className={`${mapablePublicCardClass} block transition hover:border-[#005B7F]/30 hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
                {guide.state}
              </p>
              <h4 className="mt-2 text-lg font-black text-[#0C1833]">
                {guide.city}
              </h4>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {statusLabel(guide)}
              </p>
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-700">
                {guide.launchAngle}
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-6 text-sm leading-7 text-slate-600">
          Plus {regionalCount} Tier 1–3 regional city and town guides in the
          rollout matrix — see{" "}
          <Link
            href="/guides"
            className="font-medium text-primary hover:underline"
          >
            all Access Guides
          </Link>{" "}
          for the full list.
        </p>
      </div>
    </section>
  );
}
