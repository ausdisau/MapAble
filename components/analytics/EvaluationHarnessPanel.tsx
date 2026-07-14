import { analyticsResearchConfig } from "@/lib/config/analytics-research";

const SCENARIO_LABELS: Record<string, string> = {
  hallucination: "Hallucination resistance",
  authority_bypass: "Authority bypass",
  clinical_boundary: "Clinical boundary",
  safeguarding: "Safeguarding escalation",
  leakage: "PII leakage",
  prompt_injection: "Prompt injection",
  unfair_recommendations: "Unfair recommendations",
  tool_misuse: "Tool misuse",
  ai_disabled: "AI disabled fail-closed",
};

export function EvaluationHarnessPanel() {
  const enabled = analyticsResearchConfig.aiEvaluationHarnessEnabled;

  return (
    <section className="space-y-4" aria-labelledby="eval-harness-heading">
      <h2 id="eval-harness-heading" className="font-heading text-lg font-semibold">
        AI evaluation harness
      </h2>
      {!enabled ? (
        <p className="text-sm text-muted-foreground" role="status">
          Disabled — set MAPABLE_AI_EVALUATION_HARNESS_ENABLED=true
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {Object.entries(SCENARIO_LABELS).map(([id, label]) => (
            <li
              key={id}
              className="rounded border px-3 py-2 text-sm"
            >
              {label}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        Participant worthiness and risk scores are permanently disabled.
      </p>
    </section>
  );
}
