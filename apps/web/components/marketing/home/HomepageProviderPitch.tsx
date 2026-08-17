import Link from "next/link";
import React from "react";

import { homepageProviderPitch } from "@/lib/marketing/mapable-care-combined-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function HomepageProviderPitch() {
  return (
    <section
      aria-labelledby="provider-pitch-heading"
      className="border-y border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
              For providers
            </p>
            <h2
              id="provider-pitch-heading"
              className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#0C1833] md:text-4xl"
            >
              {homepageProviderPitch.headline}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {homepageProviderPitch.body}
            </p>
            <Link
              href={homepageProviderPitch.ctaHref}
              className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#005B7F] px-5 text-sm font-black text-white ${mapableCareFocusRing}`}
            >
              {homepageProviderPitch.ctaLabel}
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {homepageProviderPitch.points.map((point) => (
              <li
                key={point}
                className="rounded-[1.3rem] border border-slate-200 bg-[#F6FBFC] px-4 py-4 text-sm font-semibold text-[#0C1833]"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
