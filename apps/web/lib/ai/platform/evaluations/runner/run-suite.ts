import { randomUUID } from "crypto";

import { formatAccessibleReport } from "../reports/accessible-text";
import { EVAL_SCENARIOS } from "../scenarios/catalog";
import type {
  EvalDimension,
  EvalRunReport,
  EvalScenarioResult,
} from "../types";
import { EVAL_DIMENSIONS } from "../types";

import { runEvalScenario } from "./run-scenario";

export function runAiEvaluationSuite(filter?: {
  ids?: string[];
  tags?: string[];
}): { report: EvalRunReport; text: string; json: string } {
  const startedAt = new Date().toISOString();
  const scenarios = EVAL_SCENARIOS.filter((s) => {
    if (filter?.ids?.length) return filter.ids.includes(s.id);
    if (filter?.tags?.length)
      return filter.tags.some((t) => s.tags.includes(t));
    return true;
  });

  const results: EvalScenarioResult[] = scenarios.map(runEvalScenario);

  const byDimension = Object.fromEntries(
    EVAL_DIMENSIONS.map((d) => [d, { passed: 0, failed: 0, total: 0 }])
  ) as EvalRunReport["byDimension"];

  for (const result of results) {
    for (const assertion of result.assertions) {
      const bucket = byDimension[assertion.dimension as EvalDimension];
      bucket.total += 1;
      if (assertion.pass) bucket.passed += 1;
      else bucket.failed += 1;
    }
  }

  const report: EvalRunReport = {
    runId: randomUUID(),
    startedAt,
    finishedAt: new Date().toISOString(),
    productionWrites: false,
    results,
    byDimension,
  };

  const text = formatAccessibleReport(report);
  const json = JSON.stringify(report, null, 2);
  return { report, text, json };
}
