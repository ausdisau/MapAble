import Link from "next/link";

import { TransportAccessDenied } from "@/components/transport/TransportAccessDenied";
import { requireAuth } from "@/lib/auth/guards";
import { canAccessOperatorTransport } from "@/lib/transport/transport-ui-access";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fleet and eligibility | MapAble Transport",
  description:
    "Manage vehicles, drivers, and eligibility evidence for accessible transport.",
};

/**
 * Pack fleet workspace shell. No fabricated fleet rows.
 * Deep fleet CRUD and credential dashboards arrive in later prompts.
 */
export default async function TransportOperatorFleetShellPage() {
  const user = await requireAuth();

  if (!canAccessOperatorTransport(user)) {
    return (
      <TransportAccessDenied
        title="Fleet workspace unavailable"
        description="Fleet and eligibility tools are limited to transport operator staff with organisation transport permissions."
        secondaryHref="/transport"
        secondaryLabel="Transport overview"
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-10 lg:px-8">
      <p>
        <Link
          href="/transport/operator"
          className="text-sm font-medium text-[#005B7F] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F]"
        >
          ← Operator workspace
        </Link>
      </p>
      <header className="space-y-2">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#005B7F]">
          Pilot
        </p>
        <h1 className="font-heading text-2xl font-bold text-[#0C1833]">
          Fleet and eligibility
        </h1>
        <p className="text-sm leading-7 text-slate-600">
          Use the provider console links below for vehicles and drivers. A
          dedicated eligibility dashboard with expiry warnings and immutable
          decision snapshots is coming next and is not claimed as production
          ready here.
        </p>
      </header>

      <div
        className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
        role="status"
      >
        <p className="text-sm leading-7 text-slate-700">
          No demo vehicles or credentials are shown on this page. Open the
          live provider lists only when your organisation has configured them.
        </p>
      </div>

      <ul className="space-y-3">
        <li>
          <Link
            href="/provider/vehicles"
            className="flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#005B7F] hover:bg-[#F6FBFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F]"
          >
            Vehicles
          </Link>
        </li>
        <li>
          <Link
            href="/provider/drivers"
            className="flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#005B7F] hover:bg-[#F6FBFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F]"
          >
            Drivers
          </Link>
        </li>
      </ul>
    </div>
  );
}
