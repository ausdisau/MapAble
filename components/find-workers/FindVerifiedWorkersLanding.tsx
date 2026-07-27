"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { LogoMark } from "@/components/marketing/mapable-care-shared";
import type { PublicVerifiedWorkerCard } from "@/lib/workers/find-verified-workers";

export function FindVerifiedWorkersLanding({
  initialWorkers,
  initialQuery = "",
}: {
  initialWorkers: PublicVerifiedWorkerCard[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);

  const workers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialWorkers;
    return initialWorkers.filter(
      (w) =>
        w.place.toLowerCase().includes(q) ||
        w.displayName.toLowerCase().includes(q) ||
        w.transportSummary.toLowerCase().includes(q),
    );
  }, [initialWorkers, query]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e8f6f2,transparent_40%),radial-gradient(circle_at_top_right,#dceef7,transparent_45%),#F6FBFC] text-[#0C1833]">
      <div className="mx-auto max-w-5xl px-5 pb-16 pt-6 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl p-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
          >
            <LogoMark compact />
            <span className="mapable-display text-2xl font-black tracking-[-0.05em] text-[#005B7F]">
              MapAble
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm font-black">
            <Link
              href="/login"
              className="rounded-xl px-3 py-2 text-[#0C1833] hover:bg-white/70 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-[#005B7F] px-4 py-2 text-white shadow-sm transition hover:bg-[#004766] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
            >
              Join
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-3xl pb-8 pt-14 text-center">
          <h1 className="mapable-display text-4xl font-black tracking-[-0.06em] text-[#0C1833] sm:text-5xl">
            Find verified NDIS transport
            <br className="hidden sm:block" /> support workers
          </h1>

          <form
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            role="search"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="sr-only" htmlFor="suburb-search">
              Search by suburb or postcode
            </label>
            <input
              id="suburb-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by suburb / postcode"
              className="h-14 flex-1 rounded-2xl border border-slate-200 bg-white px-5 text-base shadow-sm outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
            />
            <button
              type="submit"
              className="h-14 rounded-2xl bg-[#005B7F] px-8 text-base font-black text-white shadow-sm transition hover:bg-[#004766] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
            >
              Search
            </button>
          </form>

          <ul className="mx-auto mt-8 max-w-md space-y-3 text-left text-sm font-bold sm:text-base">
            <li className="flex items-center gap-3">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#00A979]/15 text-[#00A979]"
                aria-hidden
              >
                ✓
              </span>
              NDIS Worker Screening verified
            </li>
            <li className="flex items-center gap-3">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#00A979]/15 text-[#00A979]"
                aria-hidden
              >
                ✓
              </span>
              Transport-capable support workers
            </li>
            <li className="flex items-center gap-3">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#00A979]/15 text-[#00A979]"
                aria-hidden
              >
                ✓
              </span>
              Arrange services independently
            </li>
          </ul>

          <a
            href="#worker-results"
            className="mt-8 inline-flex min-w-[260px] items-center justify-center rounded-2xl bg-[#005B7F] px-8 py-3.5 text-base font-black text-white shadow-md transition hover:bg-[#004766] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
          >
            View workers
          </a>
        </section>

        <section id="worker-results" className="pt-6" aria-live="polite">
          {workers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center text-slate-600">
              No verified workers match this search yet.{" "}
              <Link href="/provider-finder" className="font-bold text-[#005B7F] underline">
                Find providers
              </Link>{" "}
              or{" "}
              <Link href="/transport" className="font-bold text-[#005B7F] underline">
                explore transport
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {workers.map((worker) => (
                <article
                  key={worker.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div
                    className="h-36 bg-[linear-gradient(135deg,#cfe8ff,#e7efff)]"
                    aria-hidden
                  />
                  <div className="space-y-2 p-5">
                    <h2 className="mapable-display text-2xl font-black tracking-[-0.03em]">
                      {worker.displayName}
                    </h2>
                    <p className="font-bold text-slate-600">{worker.place}</p>
                    <p className="inline-flex items-center gap-2 rounded-full border border-[#00A979]/30 bg-[#00A979]/10 px-3 py-1 text-sm font-black text-[#0f5132]">
                      Verified
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {worker.transportSummary}
                    </p>
                    {worker.languages.length > 0 ? (
                      <p className="text-sm text-slate-600">
                        {worker.languages.join(", ")}
                      </p>
                    ) : null}
                    <Link
                      href={`/login?callbackUrl=${encodeURIComponent("/messages")}`}
                      className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#005B7F] text-sm font-black text-white transition hover:bg-[#004766] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
                    >
                      View profile
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-14 text-center text-sm font-bold text-slate-500">
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/terms" className="underline">
            Terms
          </Link>
        </footer>
      </div>
    </div>
  );
}
