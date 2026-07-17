import { ACCOUNTABILITY_TRANSPARENCY_DISCLAIMER } from "@/lib/config/y5-rights-infrastructure";
import { listPublishedInvestmentModels } from "@/lib/transport-investment-modelling/investment-model-service";

export default async function InvestmentModelsPage() {
  const models = await listPublishedInvestmentModels();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Transport investment modelling</h1>
      <p className="text-muted-foreground">
        Scenario outputs for planning discussion — not investment advice.
      </p>
      <p className="text-xs text-muted-foreground">{ACCOUNTABILITY_TRANSPARENCY_DISCLAIMER}</p>
      <ul className="space-y-4">
        {models.map((m) => (
          <li key={m.id} className="rounded-lg border p-4">
            <h2 className="font-medium">{m.title}</h2>
            <p className="text-sm">{m.scenarioKey}</p>
            {m.suppressed ? (
              <p className="text-xs text-amber-800">Outputs suppressed (small cohort)</p>
            ) : (
              <pre className="mt-2 text-xs">{JSON.stringify(m.outputsJson, null, 2)}</pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
