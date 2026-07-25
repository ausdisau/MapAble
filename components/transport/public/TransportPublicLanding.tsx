import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ModuleCanvasSection } from "@/components/canvas/ModuleCanvasSection";
import { TransportFeatureStatus } from "@/components/transport/TransportFeatureStatus";
import {
  mapableCareFocusRing,
  mapableInteractiveFocusRing,
} from "@/lib/marketing/mapable-care-tokens";
import {
  TRANSPORT_PUBLIC_BRAND,
  TRANSPORT_PUBLIC_CTAS,
  TRANSPORT_PUBLIC_HEADLINE,
  TRANSPORT_PUBLIC_NEXT_LINKS,
  TRANSPORT_PUBLIC_SAFETY,
  TRANSPORT_PUBLIC_SUPPORTING,
  TRANSPORT_PUBLIC_TRIP_STEPS,
  TRANSPORT_PUBLIC_WHO_FOR,
} from "@/lib/transport/public-copy";

const primaryBtn = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#005B7F] px-5 py-3 text-sm font-black text-white transition hover:bg-[#004766] ${mapableCareFocusRing}`;
const secondaryBtn = `inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#0C1833] bg-white/90 px-5 py-3 text-sm font-black text-[#0C1833] transition hover:bg-white ${mapableCareFocusRing}`;
const tertiaryLink = `inline-flex min-h-11 items-center text-sm font-semibold text-[#005B7F] underline underline-offset-4 ${mapableInteractiveFocusRing}`;

export function TransportPublicLanding() {
  return (
    <div className="bg-white text-[#0C1833]">
      <HeroSection />
      <WhoForSection />
      <HowTripWorksSection />
      <TransportFeatureStatus
        heading="What’s available"
        description="Labels reflect what this build can honestly claim. Pilot and sandbox are not live national supply."
      />
      <SafetySection />
      <NextStepsSection />
      <ModuleCanvasSection module="transport" />
    </div>
  );
}

function HeroSection() {
  return (
    <section
      aria-labelledby="transport-public-heading"
      className="transport-public-hero relative isolate min-h-[100svh] overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="transport-public-hero-visual absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0C1833]/85 via-[#0C1833]/45 to-[#005B7F]/25"
      />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-5 pb-16 pt-28 lg:px-8 lg:pb-24">
        <div className="transport-public-reveal max-w-2xl text-white">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F8C51C]">
            {TRANSPORT_PUBLIC_BRAND}
          </p>
          <h1
            id="transport-public-heading"
            className="mapable-display mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl md:text-6xl"
          >
            {TRANSPORT_PUBLIC_HEADLINE}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/90 sm:text-lg sm:leading-8">
            {TRANSPORT_PUBLIC_SUPPORTING}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={TRANSPORT_PUBLIC_CTAS.primary.href}
              className={`${primaryBtn} transport-public-cta-presence`}
            >
              {TRANSPORT_PUBLIC_CTAS.primary.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={TRANSPORT_PUBLIC_CTAS.secondary.href}
              className={secondaryBtn}
            >
              {TRANSPORT_PUBLIC_CTAS.secondary.label}
            </Link>
          </div>
          <p className="mt-5">
            <Link
              href={TRANSPORT_PUBLIC_CTAS.tertiary.href}
              className={`${tertiaryLink} text-white/95 decoration-white/60 hover:decoration-white`}
            >
              {TRANSPORT_PUBLIC_CTAS.tertiary.label}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function WhoForSection() {
  return (
    <section
      aria-labelledby="transport-who-heading"
      className="transport-public-section border-b border-slate-200 bg-[#F6FBFC]"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <h2
          id="transport-who-heading"
          className="mapable-display text-3xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-4xl"
        >
          Who it’s for
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          One programme surface for the people who make accessible travel work.
        </p>
        <ul className="mt-10 grid gap-10 md:grid-cols-3">
          {TRANSPORT_PUBLIC_WHO_FOR.map((item) => (
            <li key={item.id}>
              <h3 className="text-lg font-black text-[#005B7F]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {item.summary}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HowTripWorksSection() {
  return (
    <section
      aria-labelledby="transport-steps-heading"
      className="transport-public-section border-b border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <h2
          id="transport-steps-heading"
          className="mapable-display text-3xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-4xl"
        >
          How a trip works
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Status language stays precise: requested is not booked, assigned is not
          en route, and advisory estimates are not confirmed pickup windows.
        </p>
        <ol className="mt-10 space-y-0 border-l-2 border-[#005B7F]/25 pl-6 md:border-l-0 md:pl-0">
          {TRANSPORT_PUBLIC_TRIP_STEPS.map((step, index) => (
            <li
              key={step.id}
              className="relative pb-8 md:grid md:grid-cols-[4rem_1fr] md:gap-6 md:pb-10"
            >
              <span
                className="mapable-display absolute -left-[1.85rem] flex h-8 w-8 items-center justify-center rounded-full bg-[#005B7F] text-sm font-black text-white md:static md:h-10 md:w-10"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="text-lg font-black text-[#0C1833]">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {step.summary}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function SafetySection() {
  return (
    <section
      aria-labelledby="transport-safety-heading"
      className="transport-public-section border-b border-slate-200 bg-[#0C1833] text-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <h2
          id="transport-safety-heading"
          className="mapable-display text-3xl font-black tracking-[-0.04em] sm:text-4xl"
        >
          {TRANSPORT_PUBLIC_SAFETY.heading}
        </h2>
        <ul className="mt-8 max-w-3xl space-y-4">
          {TRANSPORT_PUBLIC_SAFETY.points.map((point) => (
            <li key={point} className="text-base leading-7 text-white/90">
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function NextStepsSection() {
  return (
    <section
      aria-labelledby="transport-next-heading"
      className="transport-public-section bg-[#F6FBFC]"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <h2
          id="transport-next-heading"
          className="mapable-display text-3xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-4xl"
        >
          Find help next
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Explore providers, related MapAble programmes, or contact the team.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={TRANSPORT_PUBLIC_CTAS.primary.href}
            className={primaryBtn}
          >
            {TRANSPORT_PUBLIC_CTAS.primary.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href={TRANSPORT_PUBLIC_CTAS.secondary.href}
            className={secondaryBtn}
          >
            {TRANSPORT_PUBLIC_CTAS.secondary.label}
          </Link>
        </div>
        <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
          {TRANSPORT_PUBLIC_NEXT_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={tertiaryLink}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
