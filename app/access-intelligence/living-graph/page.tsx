import type { Metadata } from "next";
import Link from "next/link";

import { LivingGraphList } from "@/components/access-intelligence-next/LivingGraphList";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import {
  accessIntelligenceNextFlags,
  getHarbourGraph,
  projectEdgesToList,
  projectGraphToList,
  runSyntheticJourneyPreflight,
  taylorRoom312Query,
} from "@/lib/access-intelligence-next";

export const metadata: Metadata = {
  title: "Living Access Graph (synthetic) | Access Intelligence Next",
  description:
    "Synthetic Harbour Living Access Graph and journey preflight — demo contracts only.",
};

export default function LivingAccessGraphPage() {
  const enabled =
    accessIntelligenceNextFlags.enabled && accessIntelligenceNextFlags.livingAccessGraph;

  if (!enabled) {
    return (
      <MapAbleCareMarketingShell>
        <main className="mx-auto max-w-3xl px-5 py-12">
          <h1 className="text-3xl font-black tracking-tight">Living Access Graph</h1>
          <p className="mt-4 text-slate-600">
            Access Intelligence Next is disabled. Set{" "}
            <code className="rounded bg-slate-100 px-1">MAPABLE_ACCESS_INTELLIGENCE_NEXT_ENABLED</code>{" "}
            and{" "}
            <code className="rounded bg-slate-100 px-1">MAPABLE_LIVING_ACCESS_GRAPH_ENABLED</code>{" "}
            to explore the synthetic Harbour fixture locally.
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

  const graph = getHarbourGraph();
  const nodes = projectGraphToList(graph);
  const edges = projectEdgesToList(graph);
  const preflight = runSyntheticJourneyPreflight(
    taylorRoom312Query(),
    "fixture:taylor-harbour-v1",
  );

  return (
    <MapAbleCareMarketingShell>
      <main className="mx-auto max-w-4xl space-y-12 px-5 py-12">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
            Synthetic fixture — not a production claim
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Living Access Graph</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Read-only Harbour Civic precinct projection for Access Intelligence Next. Essential
            information is provided as a structured list — a map is not required.
          </p>
        </div>

        <LivingGraphList
          nodes={nodes}
          edges={edges}
          precinctLabel={graph.precinctLabel}
          limitations={graph.limitations}
        />

        <section aria-labelledby="preflight-heading" className="border-t border-slate-200 pt-8">
          <h2 id="preflight-heading" className="text-2xl font-bold">
            Synthetic journey preflight — Room 3.12
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Conclusion: <strong>{preflight.conclusion}</strong> (never a bare accessible / not
            accessible boolean).
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {preflight.unknowns.map((u) => (
              <li key={u.reason}>
                Unknown: {u.reason}
                {u.suggestedConfirmation ? ` — ${u.suggestedConfirmation}` : ""}
              </li>
            ))}
          </ul>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {preflight.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>
      </main>
    </MapAbleCareMarketingShell>
  );
}
