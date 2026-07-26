import { requireAdmin } from "@/lib/auth/guards";
import { getNationalRolloutDashboard } from "@/lib/platform/national-rollout/rollout-stage-service";

export default async function NationalRolloutAdminPage() {
  await requireAdmin();
  const dash = await getNationalRolloutDashboard();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">National rollout</h1>
      <p className="text-sm">{dash.liveCount} of {dash.total} regions live</p>
      <ul className="space-y-2">
        {dash.stages.map((s) => (
          <li key={s.id} className="rounded border p-3">
            {s.name} ({s.regionCode}) — {s.status} — {s.percentComplete}%
          </li>
        ))}
      </ul>
    </div>
  );
}
