import { requireAdmin } from "@/lib/auth/guards";
import { getSustainabilityDashboard } from "@/lib/platform/sustainability-plan/sustainability-service";

export default async function SustainabilityPlanPage() {
  await requireAdmin();
  const { plans } = await getSustainabilityDashboard();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Sustainability plan</h1>
      <ul className="space-y-4">
        {plans.map((p) => (
          <li key={p.id} className="rounded-lg border p-4">
            <strong>{p.title}</strong>
            <p className="text-sm">{p.milestones.length} milestones</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
