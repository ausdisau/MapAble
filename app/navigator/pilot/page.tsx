import type { Metadata } from "next";
import Link from "next/link";

import { NavigatorPilotJourney } from "@/components/navigator/NavigatorPilotJourney";
import { getCurrentUser } from "@/lib/auth/current-user";
import { MAPABLE_BRAND_TAGLINE, MAPABLE_LOGO_SRC } from "@/lib/brand/constants";
import { isNavigatorPilotEnabled } from "@/lib/config/navigator-pilot";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Navigator pilot — MapAble",
  description:
    "Participant-controlled MapAble Navigator pilot: goal, confirmation, hard constraints, shortlist, and draft transfer. No booking or payment.",
};

type PageProps = {
  searchParams?: Promise<{ tenantId?: string }>;
};

export default async function NavigatorPilotPage({ searchParams }: PageProps) {
  const enabled = isNavigatorPilotEnabled();
  const params = searchParams ? await searchParams : {};
  const user = enabled ? await getCurrentUser() : null;

  let tenantId: string | null = params.tenantId?.trim() || null;
  if (enabled && user && !tenantId) {
    const membership = await prisma.tenantMembership.findFirst({
      where: { userId: user.id },
      select: { tenantId: true },
      orderBy: { createdAt: "asc" },
    });
    tenantId = membership?.tenantId ?? null;
  }

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d9f0ea,transparent_42%),radial-gradient(circle_at_top_right,#d3eaf4,transparent_48%),linear-gradient(180deg,#F6FBFC_0%,#E8F2F6_100%)] px-4 py-10 text-[#0C1833]"
    >
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-5">
          <Link
            href="/"
            className="inline-flex min-w-0 flex-col items-start gap-2 rounded-2xl p-1 transition hover:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F8C51C]"
          >
            <span className="sr-only">
              MapAble home — {MAPABLE_BRAND_TAGLINE}
            </span>
            {/* Clip baked-in PNG tagline; show the canonical brand pill below. */}
            <span
              className="relative block h-14 w-auto max-w-[200px] overflow-hidden sm:h-16 sm:max-w-[240px]"
              aria-hidden
            >
              <img
                src={MAPABLE_LOGO_SRC}
                alt=""
                width={754}
                height={1008}
                className="block h-[118%] w-auto max-w-none shrink-0 bg-transparent object-contain object-left object-top"
                decoding="async"
                fetchPriority="high"
              />
            </span>
            <span className="w-full max-w-[200px] rounded-full bg-[#0C1833] px-2.5 py-1 text-center text-[0.62rem] font-black uppercase leading-none tracking-[0.1em] text-[#F8C51C] sm:max-w-[240px] sm:text-[0.68rem]">
              {MAPABLE_BRAND_TAGLINE}
            </span>
          </Link>
          <div className="space-y-2">
            <p className="text-sm font-bold tracking-wide text-[#005B7F]">
              Navigator pilot
            </p>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[#0C1833] sm:text-[1.75rem]">
              Find providers with you in control
            </h1>
            <p className="max-w-prose text-base leading-relaxed text-[#334155]">
              State a goal, confirm what we understood, keep non-negotiables,
              and review a shortlist. No booking or payment happens here.
            </p>
          </div>
        </header>

        {!enabled ? (
          <section
            aria-labelledby="pilot-disabled-heading"
            className="rounded-lg border border-[#C5D5E0] bg-white p-6"
          >
            <h2
              id="pilot-disabled-heading"
              className="text-lg font-semibold text-[#0C1833]"
            >
              Navigator pilot is not enabled
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#334155]">
              This governed pilot surface is turned off in this environment. You
              can still find providers using the classic Provider Finder — no AI
              assistance required.
            </p>
            <p className="mt-4">
              <Link
                href="/provider-finder"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#1B4F72] px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72]"
              >
                Continue to Provider Finder
              </Link>
            </p>
          </section>
        ) : !user ? (
          <section
            aria-labelledby="pilot-signin-heading"
            className="rounded-lg border border-[#C5D5E0] bg-white p-6"
          >
            <h2
              id="pilot-signin-heading"
              className="text-lg font-semibold text-[#0C1833]"
            >
              Sign in to continue
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#334155]">
              The Navigator pilot needs your account so consent and decisions
              stay under your control.
            </p>
            <p className="mt-4">
              <Link
                href="/api/auth/signin"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#1B4F72] px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72]"
              >
                Sign in
              </Link>
            </p>
          </section>
        ) : !tenantId ? (
          <section
            aria-labelledby="pilot-tenant-heading"
            className="rounded-lg border border-[#C5D5E0] bg-white p-6"
          >
            <h2
              id="pilot-tenant-heading"
              className="text-lg font-semibold text-[#0C1833]"
            >
              Tenant context required
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#334155]">
              No tenant membership was found for your account. Open this page
              with a{" "}
              <code className="rounded bg-[#F1F5F9] px-1">?tenantId=</code>{" "}
              query when authorised for a synthetic pilot, or ask an
              administrator to add a membership.
            </p>
            <p className="mt-4">
              <Link
                href="/provider-finder"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#1B4F72] bg-white px-4 py-2 text-sm font-medium text-[#0C1833] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72]"
              >
                Continue to Provider Finder
              </Link>
            </p>
          </section>
        ) : (
          <NavigatorPilotJourney tenantId={tenantId} participantId={user.id} />
        )}
      </div>
    </main>
  );
}
