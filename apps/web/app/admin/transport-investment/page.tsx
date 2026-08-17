import { requireAdmin } from "@/lib/auth/guards";
import { listPublishedInvestmentModels } from "@/lib/transport/investment-modelling/investment-model-service";

export default async function TransportInvestmentAdminPage() {
  await requireAdmin();
  const models = await listPublishedInvestmentModels();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Transport investment models</h1>
      <ul className="space-y-2">
        {models.map((m) => (
          <li key={m.id} className="rounded border p-3 text-sm">
            {m.title} — {m.scenarioKey}
          </li>
        ))}
      </ul>
    </div>
  );
}
