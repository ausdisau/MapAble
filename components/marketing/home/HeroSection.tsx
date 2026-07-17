import Link from "next/link";
import React from "react";

import { TrustStrip } from "@/components/marketing/home/TrustStrip";
import { ArrowIcon } from "@/components/marketing/mapable-care-icons";
import { WavyText } from "@/components/marketing/MapAbleCareTypography";
import {
  homepageCategoryChips,
  homepageHeroCopy,
  homepageHeroCtas,
} from "@/lib/marketing/mapable-care-combined-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

function AreaPill({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className={`min-h-11 rounded-full bg-white/80 px-4 py-3 text-sm font-black text-[#005B7F] shadow-sm ring-1 ring-slate-200 transition hover:bg-white hover:ring-[#005B7F]/30 motion-reduce:transform-none ${mapableCareFocusRing}`}
    >
      {label}
    </Link>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#F6FBFC]">
      <div className="absolute right-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-[#F8C51C]/30 blur-3xl motion-reduce:blur-none" />
      <div className="absolute bottom-[-10rem] left-[-8rem] h-96 w-96 rounded-full bg-[#00A979]/15 blur-3xl motion-reduce:blur-none" />
      <div className="relative mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="mb-6 flex flex-wrap gap-2">
          {homepageCategoryChips.map((chip) => (
            <AreaPill key={chip.label} label={chip.label} href={chip.href} />
          ))}
        </div>
        <h1 className="max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-[#0C1833] md:text-6xl lg:text-7xl">
          <WavyText text={homepageHeroCopy.headline} />
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          {homepageHeroCopy.subheading}
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {homepageHeroCtas.map((cta, index) => (
            <Link
              key={cta.href}
              href={cta.href}
              className={
                index === 0
                  ? `inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#005B7F] px-5 py-4 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#004766] ${mapableCareFocusRing}`
                  : `inline-flex min-h-12 items-center justify-center rounded-2xl border-2 border-[#0C1833] bg-white/70 px-5 py-4 text-center text-sm font-black text-[#0C1833] transition hover:bg-white ${mapableCareFocusRing}`
              }
            >
              {cta.label}
              {index === 0 ? <ArrowIcon /> : null}
            </Link>
          ))}
        </div>
        <TrustStrip />
      </div>
    </section>
  );
}
