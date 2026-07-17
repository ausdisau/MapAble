import type { LivingAccessGraphSnapshot } from "./types";

export type AccessGraphListItem = {
  id: string;
  kind: string;
  label: string;
  summary: string;
  temporalState: string;
  evidenceClass: string;
  canonicalRef: string | null;
};

/** Accessible list alternative to any graph visualisation. */
export function projectGraphToList(graph: LivingAccessGraphSnapshot): AccessGraphListItem[] {
  return graph.nodes.map((n) => ({
    id: n.id,
    kind: n.kind,
    label: n.label,
    summary: n.listSummary,
    temporalState: n.temporalState,
    evidenceClass: n.evidenceClass,
    canonicalRef: n.canonicalRef,
  }));
}

export type AccessGraphEdgeListItem = {
  id: string;
  from: string;
  to: string;
  kind: string;
  label: string;
  temporalState: string;
};

export function projectEdgesToList(graph: LivingAccessGraphSnapshot): AccessGraphEdgeListItem[] {
  return graph.edges.map((e) => ({
    id: e.id,
    from: e.from,
    to: e.to,
    kind: e.kind,
    label: e.label,
    temporalState: e.temporalState,
  }));
}
