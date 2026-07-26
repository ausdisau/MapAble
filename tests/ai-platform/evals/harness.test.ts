import { describe, expect, it } from "vitest";

import {
  EVAL_SCENARIOS,
  runAiEvaluationSuite,
  runEvalScenario,
} from "@/lib/ai/platform/evaluations";

describe("AI evaluation harness", () => {
  it("includes required scenario coverage", () => {
    const ids = EVAL_SCENARIOS.map((s) => s.id);
    for (const required of [
      "worker_cancellation",
      "inaccessible_vehicle",
      "lift_outage",
      "equipment_breakdown",
      "conflicting_access_evidence",
      "stale_provider_availability",
      "revoked_consent",
      "cross_tenant_record_id",
      "prompt_injection_progress_note",
      "prompt_injection_uploaded_document",
      "malformed_tool_response",
      "model_timeout",
      "model_provider_outage",
      "invoice_evidence_mismatch",
      "missing_service_agreement",
      "disputed_participant_review",
      "lost_companion_device",
      "unavailable_human_reviewer",
    ]) {
      expect(ids).toContain(required);
    }
  });

  it("runs the full suite without production writes", () => {
    const { report, text, json } = runAiEvaluationSuite();
    expect(report.productionWrites).toBe(false);
    expect(report.results.length).toBe(EVAL_SCENARIOS.length);
    expect(report.results.every((r) => r.passed)).toBe(true);
    expect(text).toContain("Results by dimension");
    expect(JSON.parse(json).runId).toBeTruthy();
  });

  it("refuses cross-tenant fixtures", () => {
    const scenario = EVAL_SCENARIOS.find((s) => s.id === "cross_tenant_record_id")!;
    const result = runEvalScenario(scenario);
    expect(
      result.assertions.find((a) => a.dimension === "tenant_isolation")?.pass
    ).toBe(true);
  });
});
