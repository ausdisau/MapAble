"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

import { DEMO_PROVIDERS, filterDemoProviders } from "@/lib/demo/providers";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function ProviderDirectory() {
  const [query, setQuery] = useState("");
  const [service, setService] = useState("");
  const [suburb, setSuburb] = useState("");
  const [noWaitlist, setNoWaitlist] = useState(false);
  const [availableThisWeek, setAvailableThisWeek] = useState(false);
  const [telehealth, setTelehealth] = useState(false);
  const [homeVisit, setHomeVisit] = useState(false);
  const [accessibleClinic, setAccessibleClinic] = useState(false);
  const [accessibleTransport, setAccessibleTransport] = useState(false);
  const [agencyManaged, setAgencyManaged] = useState(false);
  const [planManaged, setPlanManaged] = useState(false);
  const [selfManaged, setSelfManaged] = useState(false);
  const [verified, setVerified] = useState(false);
  const [selectedId, setSelectedId] = useState(DEMO_PROVIDERS[0]?.id ?? "");

  const providers = useMemo(
    () =>
      filterDemoProviders(DEMO_PROVIDERS, {
        query,
        service,
        suburb,
        noWaitlist,
        availableThisWeek,
        telehealth,
        homeVisit,
        accessibleClinic,
        accessibleTransport,
        agencyManaged,
        planManaged,
        selfManaged,
        verified,
      }),
    [
      query,
      service,
      suburb,
      noWaitlist,
      availableThisWeek,
      telehealth,
      homeVisit,
      accessibleClinic,
      accessibleTransport,
      agencyManaged,
      planManaged,
      selfManaged,
      verified,
    ],
  );

  const selected = providers.find((p) => p.id === selectedId) ?? providers[0] ?? null;

  return (
    <div className="bg-white text-[#0C1833]">
      <section className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
            Providers
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.04em] md:text-5xl">
            Find providers who are available, accessible, and clear about evidence.
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            MapAble is more than a listing. Compare availability, access-readiness, transport
            feasibility, response time, and evidence status. Demo listings are labelled.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[18rem_1fr] lg:px-8">
        <form
          className="space-y-3 rounded-2xl border border-slate-200 p-4"
          onSubmit={(event) => event.preventDefault()}
          aria-label="Provider filters"
        >
          <div>
            <label htmlFor="provider-query" className="text-sm font-semibold">
              Search
            </label>
            <input
              id="provider-query"
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="provider-service" className="text-sm font-semibold">
              Service type
            </label>
            <input
              id="provider-service"
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Care, therapy, transport…"
            />
          </div>
          <div>
            <label htmlFor="provider-suburb" className="text-sm font-semibold">
              Suburb / postcode
            </label>
            <input
              id="provider-suburb"
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
            />
          </div>
          {(
            [
              ["No waitlist", noWaitlist, setNoWaitlist],
              ["Available this week", availableThisWeek, setAvailableThisWeek],
              ["Telehealth", telehealth, setTelehealth],
              ["Home visit", homeVisit, setHomeVisit],
              ["Accessible clinic", accessibleClinic, setAccessibleClinic],
              ["Accessible transport supported", accessibleTransport, setAccessibleTransport],
              ["Agency-managed accepted", agencyManaged, setAgencyManaged],
              ["Plan-managed accepted", planManaged, setPlanManaged],
              ["Self-managed accepted", selfManaged, setSelfManaged],
              ["Verified by MapAble", verified, setVerified],
            ] as const
          ).map(([label, value, setter]) => (
            <label key={label} className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setter(e.target.checked)}
              />
              <span>{label}</span>
            </label>
          ))}
        </form>

        <div className="space-y-6">
          <p className="text-sm text-slate-600" role="status">
            Showing {providers.length} provider{providers.length === 1 ? "" : "s"} (demo data)
          </p>
          <ul className="space-y-4" aria-label="Provider results">
            {providers.map((provider) => (
              <li key={provider.id}>
                <article className="rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black">{provider.name}</h2>
                      <p className="text-sm text-slate-600">
                        {provider.services.join(" · ")}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Suburbs: {provider.suburbsServed.join(", ")}
                      </p>
                    </div>
                    <p className="rounded-full bg-[#F6FBFC] px-3 py-1 text-xs font-bold text-[#005B7F]">
                      Access-readiness {provider.accessReadinessScore}
                    </p>
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <Meta term="Accepting new" detail={provider.acceptingNewParticipants ? "Yes" : "No"} />
                    <Meta term="Waitlist" detail={provider.waitlistStatus} />
                    <Meta term="Earliest availability" detail={provider.earliestAvailability} />
                    <Meta term="Funding" detail={provider.fundingTypes.join(", ")} />
                    <Meta
                      term="NDIS registration"
                      detail={provider.ndisRegistered ? "Registered" : "Not registered / other"}
                    />
                    <Meta term="Transport feasibility" detail={provider.transportFeasibility} />
                    <Meta term="Response time" detail={provider.responseTime} />
                    <Meta term="Evidence status" detail={provider.evidenceStatus} />
                    <Meta term="Last updated" detail={provider.lastUpdated} />
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableCareFocusRing}`}
                      onClick={() => setSelectedId(provider.id)}
                    >
                      View profile summary
                    </button>
                    <Link
                      href="/care/request"
                      className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
                    >
                      Request introduction
                    </Link>
                    <Link
                      href="/provider-finder"
                      className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
                    >
                      Open live finder
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>

          {selected ? (
            <section
              aria-labelledby="provider-profile-heading"
              className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-6"
            >
              <h2 id="provider-profile-heading" className="text-2xl font-black">
                {selected.name} — profile sections
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ProfileBlock title="Service summary" body={selected.summary} />
                <ProfileBlock
                  title="Availability"
                  body={`${selected.acceptingNewParticipants ? "Accepting enquiries" : "Not accepting"}. Waitlist: ${selected.waitlistStatus}. Earliest: ${selected.earliestAvailability}.`}
                />
                <ProfileBlock
                  title="Access-readiness"
                  body={`Score ${selected.accessReadinessScore}. Accessible clinic: ${selected.accessibleClinic ? "yes" : "no"}. Transport supported: ${selected.accessibleTransportSupported ? "yes" : "no"}.`}
                />
                <ProfileBlock
                  title="Credentials / evidence"
                  body={`Evidence status: ${selected.evidenceStatus}. NDIS registered: ${selected.ndisRegistered ? "yes" : "no"}. Last updated ${selected.lastUpdated}.`}
                />
                <ProfileBlock title="Response performance" body={selected.responseTime} />
                <ProfileBlock
                  title="Pricing transparency"
                  body="Demo profiles do not publish prices. Ask the provider before booking."
                />
                <ProfileBlock
                  title="Complaint pathway"
                  body="Contact the provider first, then use MapAble Help Centre if you need platform support."
                />
                <ProfileBlock
                  title="Transport options"
                  body={`Feasibility: ${selected.transportFeasibility}. Plan a trip via the journey planner when needed.`}
                />
              </div>
              <Link
                href="/care/request"
                className={`mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableCareFocusRing}`}
              >
                Request introduction
              </Link>
            </section>
          ) : null}

          <p className="text-sm text-slate-600" role="note">
            Provider information should be confirmed before booking. MapAble displays evidence
            status so users can see what is verified, declared, expired, or unknown.
          </p>
        </div>
      </div>
    </div>
  );
}

function Meta({ term, detail }: { term: string; detail: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{term}</dt>
      <dd className="font-semibold capitalize">{detail}</dd>
    </div>
  );
}

function ProfileBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}
