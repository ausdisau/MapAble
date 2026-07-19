import Link from "next/link";

import { TransportAccessDenied } from "@/components/transport/TransportAccessDenied";
import { requireAuth } from "@/lib/auth/guards";
import { canAccessOperatorTransport } from "@/lib/transport/transport-ui-access";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Operator dispatch workspace | MapAble Transport",
  description:
    "Quote, assign, and monitor accessible transport trips for your organisation.",
};

/**
 * Pack entry for the operator workspace.
 * Canonical dispatch UI remains under /provider/transport.
 * Access today uses transport org permissions; membership-based checks come later.
 */
export default async function TransportOperatorShellPage() {
  const user = await requireAuth();

  if (!canAccessOperatorTransport(user)) {
    return (
      <TransportAccessDenied
        title="Operator workspace unavailable"
        description="This area is for transport operator staff with organisation transport permissions. Participants should use Request trip; drivers should use the driver workspace. Operator membership checks will tighten in a later prompt."
        secondaryHref="/transport/request"
        secondaryLabel="Request transport"
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-10 lg:px-8">
      <header className="space-y-2">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#005B7F]">
          Pilot
        </p>
        <h1 className="font-heading text-2xl font-bold text-[#0C1833]">
          Operator dispatch workspace
        </h1>
        <p className="text-sm leading-7 text-slate-600">
          Open the provider transport console for bookings, dispatch, and runs.
          Exact addresses stay restricted until acceptance rules allow them.
          Eligibility verification is not a public production claim yet.
        </p>
      </header>

      <ul className="space-y-3">
        <li>
          <Link
            href="/provider/transport/dispatch"
            className="flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#005B7F] hover:bg-[#F6FBFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F]"
          >
            Open dispatch board
          </Link>
        </li>
        <li>
          <Link
            href="/provider/transport"
            className="flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#005B7F] hover:bg-[#F6FBFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F]"
          >
            Transport bookings
          </Link>
        </li>
        <li>
          <Link
            href="/transport/operator/fleet"
            className="flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#005B7F] hover:bg-[#F6FBFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F]"
          >
            Fleet and eligibility workspace
          </Link>
        </li>
      </ul>
    </div>
  );
}
