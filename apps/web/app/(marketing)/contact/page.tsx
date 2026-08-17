import Link from "next/link";

import { ContactForm } from "@/components/marketing/ContactForm";
import { MAPABLE_SUPPORT_EMAIL } from "@/lib/brand/constants";
import { canonicalAlternate } from "@/lib/config/canonical-url";
import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicMutedCardClass,
  mapablePublicPageContainerClass,
  mapablePublicSectionTitleClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

export const metadata = {
  title: "Contact | MapAble",
  description:
    "Contact MapAble about participant pilots, provider registration, access reviews or privacy requests.",
  alternates: canonicalAlternate("/contact"),
};

const infoSections = [
  {
    title: "Pilot enquiries",
    body: "Tell us whether you are a participant, provider, support coordinator, plan manager, employer, venue or community partner. We will confirm what is available now and what is still in pilot.",
  },
  {
    title: "Accessibility feedback",
    body: "If any page is hard to use with keyboard, screen reader, zoom, captions, contrast preferences or alternative input, contact us so it can be recorded and prioritised.",
  },
  {
    title: "Privacy requests",
    body: "For access, correction or deletion requests, choose the privacy topic in the form or read our data deletion guidance first.",
  },
];

export default function ContactPage() {
  return (
    <div className="bg-white text-mapable-navy">
      <section className="relative overflow-hidden border-b border-slate-200 bg-mapable-surface">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-mapable-gold/25 blur-3xl"
        />
        <div
          className={`${mapablePublicPageContainerClass} relative py-14 sm:py-20`}
        >
          <div className="max-w-3xl">
            <p className={mapablePublicEyebrowClass}>Contact</p>
            <h1 className={`${mapablePublicTitleClass} mt-3`}>
              Contact MapAble
            </h1>
            <p className={mapablePublicLeadClass}>
              Use the form for pilot interest, provider enquiries, accessibility
              feedback and privacy requests. You can also email us directly.
            </p>
            <p className="mt-4 text-sm text-slate-600">
              Email{" "}
              <a
                href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
                className="font-bold text-mapable-brand hover:underline"
              >
                {MAPABLE_SUPPORT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start">
          <ContactForm />

          <aside className="space-y-5">
            <article
              className={`${mapablePublicMutedCardClass} border-[#005B7F]/15`}
            >
              <p className={mapablePublicSectionTitleClass}>Before you send</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                <li>We usually reply by email within a few business days.</li>
                <li>
                  Do not attach NDIS plans or clinical records through this
                  form.
                </li>
                <li>
                  For urgent safety matters in Australia, call{" "}
                  <strong>000</strong> — MapAble is not an emergency service.
                </li>
              </ul>
            </article>

            {infoSections.map((section) => (
              <article key={section.title} className={mapablePublicCardClass}>
                <h2 className="text-lg font-black text-mapable-navy">
                  {section.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {section.body}
                </p>
              </article>
            ))}

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/help"
                className="text-sm font-bold text-mapable-brand hover:underline"
              >
                Help centre
              </Link>
              <Link
                href="/privacy"
                className="text-sm font-bold text-mapable-brand hover:underline"
              >
                Privacy policy
              </Link>
              <Link
                href="/data-deletion"
                className="text-sm font-bold text-mapable-brand hover:underline"
              >
                Data deletion
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
