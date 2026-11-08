import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { getNdisPlatformAdapterStatus } from "@/lib/ndis/platform-adapter/ndis-platform-adapter";

export const metadata = { title: "NDIS platform adapter readiness | MapAble" };

export default async function NdisPlatformAdapterPage() {
  await requireAdmin();
  const state = getNdisPlatformAdapterStatus();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">
          MapAble NDIS Integration Adapter
        </h1>
        <p className="max-w-3xl text-slate-700">
          Source-aware integration readiness for government transactions,
          public provider records, worker screening and platform registration.
        </p>
      </header>

      <p role="status" className="rounded-lg border-2 border-amber-500 bg-amber-50 p-4 text-[#0C1833]">
        <strong>Not a live or NDIA-approved integration.</strong> The current
        adapter is {state.mode.replaceAll("_", " ")}. No individual worker
        clearance, platform registration or provider availability has been
        verified by this page.
      </p>

      <section aria-labelledby="ndis-adapter-capabilities" className="space-y-4">
        <h2 id="ndis-adapter-capabilities" className="text-xl font-bold">
          Evidence and required actions
        </h2>
        <ul className="grid gap-4">
          {state.lanes.map((lane) => (
            <li key={lane.id} className="rounded-xl border border-slate-300 bg-white p-4">
              <h3 className="text-lg font-bold">{lane.title}</h3>
              <p className="mt-1 text-sm font-semibold">
                Evidence: {lane.evidence.replaceAll("_", " ")}
              </p>
              <p className="mt-2 text-sm text-slate-700">{lane.limitations}</p>
              <a
                href={lane.officialSource}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 items-center font-semibold text-[#005B7F] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/50"
              >
                Official source (opens new tab)
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ndis-adapter-limitations" className="space-y-2">
        <h2 id="ndis-adapter-limitations" className="text-xl font-bold">
          Current transaction and screening permissions
        </h2>
        <p className="text-slate-700">
          NDIA claims: not available. Worker assignment: not available.
          NDIS eligibility decisions: not available. Human review required.
        </p>
        {state.ndiaLegacySubmissionFlagObserved ? (
          <p role="alert" className="rounded-lg border border-red-500 p-4 font-semibold">
            Review the legacy NDIA real-submission setting immediately.
            A feature flag is not government approval.
          </p>
        ) : null}
        <p>
          <Link
            href="/admin/ndia-readiness"
            className="inline-flex min-h-11 items-center font-semibold text-[#005B7F] underline underline-offset-4"
          >
            Review the separate NDIA gateway
          </Link>
        </p>
      </section>
    </div>
  );
}
