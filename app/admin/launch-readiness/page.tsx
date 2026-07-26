import { requireAdmin } from "@/lib/auth/guards";
import { getLaunchReadinessSummary } from "@/lib/platform/launch-readiness/launch-readiness-service";

export default async function LaunchReadinessPage() {
  await requireAdmin();
  const summary = await getLaunchReadinessSummary();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Production launch readiness</h1>
      <p className="text-lg">
        Progress: {summary.ready} of {summary.total} items ready ({summary.percent}%)
      </p>
      {summary.productionReady ? (
        <p className="rounded-lg border border-green-600 bg-green-50 p-4 text-green-900">
          All checklist items complete or waived.
        </p>
      ) : (
        <p className="text-muted-foreground">
          Complete remaining items with evidence before public launch.
        </p>
      )}
      <ul className="space-y-2">
        {summary.items.map((item) => (
          <li key={item.id} className="rounded-lg border p-3">
            <strong>{item.title}</strong>
            <span className="ml-2 text-sm">({item.status.replace(/_/g, " ")})</span>
            <p className="text-sm text-muted-foreground">{item.category}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
