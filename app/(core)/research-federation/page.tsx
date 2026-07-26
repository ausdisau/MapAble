import { FEDERATED_RESEARCH_DISCLAIMER } from "@/lib/config/y5-rights-infrastructure";
import { listPublicFederationNodes } from "@/lib/research/federation-at-scale/federation-node-service";

export default async function ResearchFederationPage() {
  const nodes = await listPublicFederationNodes();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Research federation</h1>
      <p className="text-sm text-muted-foreground">{FEDERATED_RESEARCH_DISCLAIMER}</p>
      <ul className="space-y-4">
        {nodes.map((n) => (
          <li key={n.id} className="rounded-lg border p-4">
            <h2 className="font-semibold">{n.nodeName}</h2>
            {n.institution ? <p className="text-sm">{n.institution}</p> : null}
            {n.scope ? <p className="text-sm text-muted-foreground">{n.scope}</p> : null}
            {n.syntheticOnly ? (
              <span className="mt-2 inline-block rounded bg-green-100 px-2 py-0.5 text-xs text-green-900">
                Synthetic data only
              </span>
            ) : null}
          </li>
        ))}
        {nodes.length === 0 ? (
          <li className="text-sm text-muted-foreground">No federation nodes published.</li>
        ) : null}
      </ul>
    </div>
  );
}
