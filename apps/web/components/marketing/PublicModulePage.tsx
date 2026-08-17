import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicMutedCardClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
  mapablePublicSectionTitleClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

type CallToAction = {
  label: string;
  href: string;
  variant?: "default" | "secondary" | "outline";
};

export type PublicModulePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  whoFor: string[];
  availableNow: string[];
  comingSoon: string[];
  safetyNote: ReactNode;
  primaryCta: CallToAction;
  secondaryCta?: CallToAction;
};

const relatedModules = [
  { label: "Care", href: "/care" },
  { label: "Transport", href: "/transport" },
  { label: "Employment", href: "/employment" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Foods", href: "/foods" },
  { label: "Kids", href: "/kids" },
  { label: "Moves", href: "/moves" },
  { label: "Accessible places", href: "/access" },
  { label: "Provider finder", href: "/provider-finder" },
];

export function PublicModulePage({
  eyebrow,
  title,
  description,
  whoFor,
  availableNow,
  comingSoon,
  safetyNote,
  primaryCta,
  secondaryCta,
}: PublicModulePageProps) {
  return (
    <div className="bg-white text-[#0C1833]">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#F6FBFC]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-[#F8C51C]/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-8rem] left-[-6rem] h-72 w-72 rounded-full bg-[#00A979]/10 blur-3xl"
        />
        <div className={`${mapablePublicPageContainerClass} relative py-14 sm:py-20`}>
          <div className="max-w-3xl">
            <p className={mapablePublicEyebrowClass}>{eyebrow}</p>
            <h1 className={`${mapablePublicTitleClass} mt-3`}>{title}</h1>
            <p className={mapablePublicLeadClass}>{description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryCta.href}
                className={mapablePublicPrimaryButtonClass}
              >
                {primaryCta.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              {secondaryCta ? (
                <Link
                  href={secondaryCta.href}
                  className={mapablePublicSecondaryButtonClass}
                >
                  {secondaryCta.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
        <div className="mb-8 max-w-2xl">
          <p className={mapablePublicSectionTitleClass}>Module overview</p>
          <h2 className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl">
            What you can explore today, and what is still in progress.
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <InfoPanel
            title="Who it is for"
            description="The people and teams this module is designed to support."
            items={whoFor}
            tone="default"
          />
          <InfoPanel
            title="Available now"
            description="Safe public-facing capabilities in the current pilot build."
            items={availableNow}
            tone="highlight"
          />
          <InfoPanel
            title="Coming soon"
            description="Planned capabilities that are not yet production claims."
            items={comingSoon}
            tone="muted"
          />
        </div>

        <div className="mt-8 rounded-[1.7rem] border border-[#005B7F]/15 bg-[#F8C51C]/15 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#005B7F]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#0C1833]">
                Privacy and safety note
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                MapAble is being built with consent, verification and audit
                controls at the centre.
              </p>
              <div className="mt-4 text-sm leading-7 text-slate-700">
                {safetyNote}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className={`${mapablePublicPageContainerClass} py-10 sm:py-12`}>
          <p className={mapablePublicSectionTitleClass}>Explore MapAble</p>
          <h2 className="mapable-display mt-2 text-xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-2xl">
            Related modules and entry points
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {relatedModules.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#005B7F] transition hover:border-[#005B7F]/30 hover:bg-[#F6FBFC] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoPanel({
  title,
  description,
  items,
  tone,
}: {
  title: string;
  description: string;
  items: string[];
  tone: "default" | "highlight" | "muted";
}) {
  const panelClass =
    tone === "highlight"
      ? "rounded-[1.5rem] border border-[#005B7F]/15 bg-[#005B7F]/5 p-5"
      : tone === "muted"
        ? mapablePublicMutedCardClass
        : mapablePublicCardClass;

  return (
    <article className={panelClass}>
      <h3 className="text-lg font-black text-[#0C1833]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
            <span
              className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#005B7F]"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
