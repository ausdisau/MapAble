import type { AccessGraphEdgeListItem, AccessGraphListItem } from "@/lib/access-intelligence-next";

type Props = {
  nodes: AccessGraphListItem[];
  edges: AccessGraphEdgeListItem[];
  precinctLabel: string;
  limitations: string[];
};

/**
 * Accessible list alternative to the Living Access Graph.
 * Essential accessibility information must not require a map.
 */
export function LivingGraphList({ nodes, edges, precinctLabel, limitations }: Props) {
  return (
    <div className="space-y-8 text-[#0C1833]">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">{precinctLabel}</h2>
        <p className="text-sm text-slate-600">
          Synthetic Living Access Graph — list view. Not a public accessibility claim.
        </p>
      </header>

      <section aria-labelledby="graph-nodes-heading">
        <h3 id="graph-nodes-heading" className="text-lg font-semibold">
          Places and features ({nodes.length})
        </h3>
        <ol className="mt-3 list-decimal space-y-3 pl-5">
          {nodes.map((n) => (
            <li key={n.id} className="pl-1">
              <p className="font-medium">
                {n.label}{" "}
                <span className="text-sm font-normal text-slate-600">({n.kind})</span>
              </p>
              <p className="text-sm text-slate-700">{n.summary}</p>
              <p className="text-xs text-slate-500">
                Temporal state: {n.temporalState}; evidence: {n.evidenceClass}
                {n.canonicalRef ? `; ref: ${n.canonicalRef}` : ""}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="graph-edges-heading">
        <h3 id="graph-edges-heading" className="text-lg font-semibold">
          Connections ({edges.length})
        </h3>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {edges.map((e) => (
            <li key={e.id} className="text-sm text-slate-700">
              <span className="font-medium">{e.label}</span> — {e.from} → {e.to} (
              {e.kind}; {e.temporalState})
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="graph-limitations-heading">
        <h3 id="graph-limitations-heading" className="text-lg font-semibold">
          Limitations
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
