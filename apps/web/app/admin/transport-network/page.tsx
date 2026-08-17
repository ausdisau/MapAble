import { requireAdmin } from "@/lib/auth/guards";
import { getTransportNetworkRolloutSummary } from "@/lib/transport/network-rollout/rollout-service";

export default async function TransportNetworkPage() {
  await requireAdmin();
  const summary = await getTransportNetworkRolloutSummary();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Transport network rollout</h1>
      <p className="text-sm">Operators: {summary.totalOperators}</p>
      <ul className="space-y-2">
        {summary.regions.map((r) => (
          <li key={r.id} className="rounded border p-3">
            {r.name} ({r.code}) — {r.status} — {r.rolloutPercent}%
          </li>
        ))}
      </ul>
    </div>
  );
}
