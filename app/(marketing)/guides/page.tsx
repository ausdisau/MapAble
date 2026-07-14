import Link from "next/link";
import React from "react";

import { AccessGuidesSection } from "@/components/resources/AccessGuidesSection";
import { PublicInfoPage } from "@/components/marketing/PublicInfoPage";
import {
  accessGuides,
  getAccessGuidesByTier,
  getCapitalAccessGuides,
} from "@/lib/resources/access-guides-data";
import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicPageContainerClass,
} from "@/lib/marketing/public-page-styles";

export const metadata = {
  title: "Access Guides | MapAble",
  description:
    "MapAble Access Guides for Australian capital cities and regional locations — practical accessibility planning for visitors and locals.",
};

const regionalTiers = ["Tier 1", "Tier 2", "Tier 3"] as const;

export default function GuidesIndexPage() {
  const capitalGuides = getCapitalAccessGuides();
  const regionalCount = accessGuides.length - capitalGuides.length;

  return (
    <>
      <PublicInfoPage
        eyebrow="Access Guides"
        title="Accessibility guides for cities and towns across Australia."
        description="Capital starter guides are drafted first. Regional Tier 1–3 guides need local verification of beach access, transport, toilets, gradients and quiet routes."
        ctaLabel="Back to resources"
        ctaHref="/resources"
        sections={[
          {
            title: "How to use these guides",
            content: (
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Start with a capital city guide for visitor-facing day planning.
                </li>
                <li>
                  Download the full Australia guide pack (PDF or Word) from the
                  resources hub.
                </li>
                <li>
                  Regional guides flag mapping missions that still need local
                  verification before they are treated as complete.
                </li>
              </ul>
            ),
          },
          {
            title: "Guide coverage",
            content: (
              <p>
                {capitalGuides.length} capital starter guides and{" "}
                {regionalCount} regional guides across all states and
                territories. Status labels show whether a guide is drafted or
                still needs local verification.
              </p>
            ),
          },
        ]}
      />
      <AccessGuidesSection
        capitalGuides={capitalGuides}
        regionalCount={regionalCount}
        title="Capital Access Guides"
        id="guides-capital"
      />
      {regionalTiers.map((tier) => {
        const guides = getAccessGuidesByTier(tier);
        return (
          <section
            key={tier}
            id={`guides-${tier.toLowerCase().replace(/\s+/g, "-")}`}
            className="border-b border-slate-200 bg-white"
            aria-labelledby={`guides-${tier}-heading`}
          >
            <div
              className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}
            >
              <p className={mapablePublicEyebrowClass}>{tier}</p>
              <h2
                id={`guides-${tier}-heading`}
                className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
              >
                {tier} regional Access Guides
              </h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                {guides.length} locations scheduled for local verification.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {guides.map((guide) => (
                  <Link
                    key={guide.href}
                    href={guide.href}
                    className={`${mapablePublicCardClass} block transition hover:border-[#005B7F]/30 hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40`}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
                      {guide.state} · {guide.guideType}
                    </p>
                    <h3 className="mt-2 text-lg font-black text-[#0C1833]">
                      {guide.city}
                    </h3>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      {guide.status}
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-700">
                      {guide.launchAngle}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
