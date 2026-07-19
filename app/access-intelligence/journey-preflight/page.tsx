import type { Metadata } from "next";
import Link from "next/link";

import { JourneyPreflightList } from "@/components/access-intelligence-next/JourneyPreflightList";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import {
  accessIntelligenceNextFlags,
  runDoorToRoomPreflight,
  taylorRoom312Query,
} from "@/lib/access-intelligence-next";

export const metadata: Metadata = {
  title: "Journey preflight (synthetic) | Access Intelligence Next",
  description: "Proof-carrying door-to-room journey preflight — synthetic Harbour scenario.",
};

export default function JourneyPreflightPage() {
  const enabled =
    accessIntelligenceNextFlags.enabled &&
    accessIntelligenceNextFlags.proofCarryingResults;

  if (!enabled) {
    return (
      <MapAbleCareMarketingShell>
        <main className="mx-auto max-w-3xl px-5 py-12">
          <h1 className="text-3xl font-black tracking-tight">Journey preflight</h1>
          <p className="mt-4 text-slate-600">
            Enable{" "}
            <code className="rounded bg-slate-100 px-1">MAPABLE_ACCESS_INTELLIGENCE_NEXT_ENABLED</code>{" "}
            and{" "}
            <code className="rounded bg-slate-100 px-1">MAPABLE_PROOF_CARRYING_RESULTS_ENABLED</code>{" "}
            to view the synthetic door-to-room preflight.
          </p>
          <p className="mt-4">
            <Link className="text-sky-800 underline" href="/access-intelligence">
              Back to Access Intelligence
            </Link>
          </p>
        </main>
      </MapAbleCareMarketingShell>
    );
  }

  const { preflight, proof } = runDoorToRoomPreflight({
    query: taylorRoom312Query(),
    requirementSetRef: "fixture:taylor-harbour-v1",
  });

  return (
    <MapAbleCareMarketingShell>
      <main className="mx-auto max-w-4xl space-y-10 px-5 py-12">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
            Synthetic fixture — not a production claim
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Proof-carrying journey preflight
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Taylor → Harbour Civic Room 3.12. Conclusion{" "}
            <strong>{proof.conclusion}</strong> with evidence, unknowns, and confirmation
            questions. A map is not required.
          </p>
        </div>

        <JourneyPreflightList preflight={preflight} />

        <section aria-labelledby="proof-heading" className="border-t border-slate-200 pt-8">
          <h2 id="proof-heading" className="text-xl font-bold">
            Proof envelope summary
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Matched: {proof.matchedConstraints.length}</li>
            <li>Failed: {proof.failedConstraints.length}</li>
            <li>Unresolved: {proof.unresolvedConstraints.length}</li>
            <li>Evidence refs: {proof.evidenceReferences.length}</li>
          </ul>
        </section>
      </main>
    </MapAbleCareMarketingShell>
  );
}
