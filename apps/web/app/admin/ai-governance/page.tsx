import { getAiGovernanceDashboard } from "@/lib/ai/governance/governance-service";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AiGovernancePage() {
  await requireAdmin();
  const data = await getAiGovernanceDashboard();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">AI governance</h1>
      <p className="text-muted-foreground">
        Model versions, fairness warnings, human overrides and open incidents.
      </p>
      <section>
        <h2 className="font-semibold">Open incidents ({data.incidents.length})</h2>
        <ul className="mt-2 space-y-2">
          {data.incidents.map((i) => (
            <li key={i.id} className="rounded border p-2 text-sm">
              {i.summary}
            </li>
          ))}
        </ul>
      </section>
      <p className="text-sm">
        Fairness warnings (recent): {data.fairnessWarningCount}
      </p>
    </div>
  );
}
