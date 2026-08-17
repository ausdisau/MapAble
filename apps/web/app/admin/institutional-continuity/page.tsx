import { requireAdmin } from "@/lib/auth/guards";
import { getContinuityDashboard } from "@/lib/platform/institutional-continuity/continuity-service";

export default async function InstitutionalContinuityPage() {
  await requireAdmin();
  const { plans } = await getContinuityDashboard();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Institutional continuity</h1>
      <ul className="space-y-4">
        {plans.map((p) => (
          <li key={p.id} className="rounded-lg border p-4">
            {p.title} — {p.checkpoints.length} checkpoints
          </li>
        ))}
      </ul>
    </div>
  );
}
