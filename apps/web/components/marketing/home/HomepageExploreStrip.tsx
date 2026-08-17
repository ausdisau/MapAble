import Link from "next/link";
import React from "react";

import { homepageExploreFeatures } from "@/lib/marketing/mapable-care-combined-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

/**
 * Public discovery links grounded in live informational routes / explainers.
 * Does not promote flag-gated bookings, claims, or payments.
 */
export function HomepageExploreStrip() {
  return (
    <section
      aria-labelledby="explore-features-heading"
      className="border-y border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-14">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
          Explore MapAble
        </p>
        <h2
          id="explore-features-heading"
          className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.04em] text-[#0C1833] md:text-4xl"
        >
          What you can use on the public site today
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          These surfaces are available now as informational pages and discovery
          tools. Care bookings, live transport matching, and NDIS claims stay
          separately governed and are not generally available here.
        </p>
        <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {homepageExploreFeatures.map((feature) => (
            <li key={feature.href} className="border-t border-slate-200 pt-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#005B7F]">
                {feature.eyebrow}
              </p>
              <h3 className="mt-2 text-xl font-black text-[#0C1833]">
                <Link
                  href={feature.href}
                  className={`underline-offset-4 hover:underline ${mapableCareFocusRing}`}
                >
                  {feature.title}
                </Link>
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {feature.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
