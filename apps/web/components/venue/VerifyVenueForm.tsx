"use client";

import React, { useState } from "react";

import { ACCREDITATION_CRITERIA } from "@/lib/access/accreditation/accreditation-criteria-service";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

const domains = Array.from(new Set(ACCREDITATION_CRITERIA.map((item) => item.domain)));

export function VerifyVenueForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="bg-white text-[#0C1833]">
      <section className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
          <h1 className="text-4xl font-black tracking-[-0.04em] md:text-5xl">
            Make your accessibility visible, measurable, and easier to improve.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Start a venue access check based on MapAble accreditation domains. Verification is
            not legal certification.
          </p>
          <a
            href="#venue-intake"
            className={`mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-5 text-sm font-black text-white ${mapableCareFocusRing}`}
          >
            Start venue access check
          </a>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-10 px-5 py-12 lg:px-8">
        <section aria-labelledby="tiers-heading">
          <h2 id="tiers-heading" className="text-2xl font-black">
            Accreditation explainer
          </h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-3">
            <TierCard title="Bronze" body="Foundational access across core domains." />
            <TierCard title="Silver" body="Strong accessibility with fewer unknowns." />
            <TierCard title="Gold" body="Best-practice universal access evidence." />
          </ul>
          <p className="mt-4 text-sm text-slate-600">
            Verification is not legal certification under the Disability Discrimination Act or
            building standards.
          </p>
        </section>

        <form
          id="venue-intake"
          className="space-y-4 rounded-2xl border border-slate-200 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <h2 className="text-xl font-black">Venue intake form</h2>
          <Field id="venue-name" label="Venue name" required />
          <Field id="venue-type" label="Venue type" required />
          <Field id="venue-address" label="Address" required />
          <Field id="contact-person" label="Contact person" required />
          <Field id="email" label="Email" type="email" required />
          <Field id="phone" label="Phone" type="tel" />
          <Field id="website" label="Website" type="url" />
          <Field id="access-url" label="Current accessibility info URL" type="url" />
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="public-page" />
            Interested in public access page?
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="staff-training" />
            Interested in staff training?
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name="council-reporting" />
            Interested in council/precinct reporting?
          </label>
          <button
            type="submit"
            className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-5 text-sm font-black text-white ${mapableCareFocusRing}`}
          >
            Submit venue check request (demo)
          </button>
          {submitted ? (
            <p className="text-sm text-emerald-800" role="status">
              Demo submission received. No venue data was sent to a backend.
            </p>
          ) : null}
        </form>

        <section aria-labelledby="self-assess-heading">
          <h2 id="self-assess-heading" className="text-2xl font-black">
            Self-assessment preview
          </h2>
          <ul className="mt-4 space-y-3">
            {domains.map((domain) => (
              <li key={domain} className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold">{domain}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Preview checklist items from MapAble accreditation criteria for this domain.
                </p>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                  {ACCREDITATION_CRITERIA.filter((item) => item.domain === domain)
                    .slice(0, 3)
                    .map((item) => (
                      <li key={item.code}>
                        {item.code}: {item.title}
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="output-preview-heading"
          className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-5"
        >
          <h2 id="output-preview-heading" className="text-2xl font-black">
            Sample public accessibility page badge
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="font-bold">Access score</dt>
              <dd>78 (demo)</dd>
            </div>
            <div>
              <dt className="font-bold">Tier</dt>
              <dd>Silver</dd>
            </div>
            <div>
              <dt className="font-bold">Assessed date</dt>
              <dd>2026-06-01</dd>
            </div>
            <div>
              <dt className="font-bold">Next review date</dt>
              <dd>2027-06-01</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-slate-700">
            Exact details and improvement actions appear after assessment. Paid plans improve
            tooling, not evidence-based trust scores.
          </p>
        </section>

        <p className="text-sm text-slate-600" role="note">
          MapAble verification provides structured access information and improvement guidance.
          It does not certify legal compliance.
        </p>
      </div>
    </div>
  );
}

function TierCard({ title, body }: { title: string; body: string }) {
  return (
    <li className="rounded-2xl border border-slate-200 p-4">
      <h3 className="font-black">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </li>
  );
}

function Field({
  id,
  label,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
      />
    </div>
  );
}
