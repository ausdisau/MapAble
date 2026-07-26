import type { EvalRunReport } from "../types";

export function formatAccessibleReport(report: EvalRunReport): string {
  const lines: string[] = [];
  lines.push("MapAble AI Evaluation Report");
  lines.push(`Run: ${report.runId}`);
  lines.push(`Started: ${report.startedAt}`);
  lines.push(`Finished: ${report.finishedAt}`);
  lines.push("Production writes: no");
  lines.push("");
  lines.push("Results by dimension");
  for (const [dimension, stats] of Object.entries(report.byDimension)) {
    lines.push(
      `- ${dimension}: ${stats.passed} passed, ${stats.failed} failed, ${stats.total} total`
    );
  }
  lines.push("");
  lines.push("Results by scenario");
  for (const result of report.results) {
    lines.push(
      `- ${result.scenarioId}: ${result.passed ? "PASS" : "FAIL"} (${result.assertions.length} assertions)`
    );
    for (const a of result.assertions.filter((x) => !x.pass)) {
      lines.push(`  - FAIL ${a.dimension}: ${a.description}`);
    }
  }
  return lines.join("\n");
}
