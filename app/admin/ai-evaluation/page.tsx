import { EvaluationHarnessPanel } from "@/components/analytics/EvaluationHarnessPanel";
import { requireAdmin } from "@/lib/auth/guards";
import { analyticsResearchConfig } from "@/lib/config/analytics-research";
import { EVALUATION_SCENARIO_IDS } from "@/lib/intelligence/evaluation";

export const metadata = { title: "AI evaluation harness | MapAble Admin" };

export default async function AdminAiEvaluationPage() {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">AI evaluation harness</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Synthetic evaluation scenarios for hallucination, authority bypass, clinical
          boundaries, safeguarding, leakage, prompt injection, unfair recommendations,
          tool misuse, and AI-disabled fail-closed behaviour.
        </p>
      </header>

      <EvaluationHarnessPanel />

      <section aria-labelledby="scenarios-detail-heading" className="space-y-4">
        <h2 id="scenarios-detail-heading" className="font-heading text-lg font-semibold">
          Scenario catalogue
        </h2>
        {analyticsResearchConfig.aiEvaluationHarnessEnabled ? (
          <ul className="space-y-2 text-sm">
            {EVALUATION_SCENARIO_IDS.map((id) => (
              <li key={id} className="rounded border px-3 py-2 font-mono text-xs">
                {id}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground" role="status">
            Enable MAPABLE_AI_EVALUATION_HARNESS_ENABLED to run scenarios.
          </p>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Participant worthiness score:{" "}
        {analyticsResearchConfig.participantWorthinessScoreEnabled ? "enabled" : "disabled"}
        {" · "}
        Participant risk score:{" "}
        {analyticsResearchConfig.participantRiskScoreEnabled ? "enabled" : "disabled"}
      </p>
    </div>
  );
}
