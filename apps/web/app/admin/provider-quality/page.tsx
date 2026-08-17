import { requireAdmin } from "@/lib/auth/guards";
import { getProviderQualityDashboard } from "@/lib/provider/quality/quality-service";

export default async function ProviderQualityPage() {
  await requireAdmin();
  const { scores } = await getProviderQualityDashboard();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Provider quality</h1>
      <p className="text-muted-foreground">
        Explainable scores — not punitive automation. Safeguard reviews required
        for enforcement actions.
      </p>
      <ul className="space-y-3">
        {scores.map((s) => (
          <li key={s.id} className="rounded-lg border p-4">
            <p className="font-medium">Score: {(s.score * 100).toFixed(0)}%</p>
            <p className="text-sm">{s.explanation}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
