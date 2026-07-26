#!/usr/bin/env tsx
/**
 * Synthetic-only AI evaluation harness.
 * Usage: pnpm ai:evals
 * No production writes. No live participant data.
 */
import { runAiEvaluationSuite } from "@/lib/ai/platform/evaluations";

const ids = process.argv.includes("--id")
  ? process.argv.slice(process.argv.indexOf("--id") + 1).filter((a) => !a.startsWith("--"))
  : undefined;

const { report, text } = runAiEvaluationSuite(ids?.length ? { ids } : undefined);
process.stdout.write(`${text}\n`);

const failed = report.results.filter((r) => !r.passed);
if (failed.length) {
  process.stderr.write(
    `\n${failed.length} scenario(s) failed: ${failed.map((f) => f.scenarioId).join(", ")}\n`
  );
  process.exit(1);
}

process.stderr.write(
  `\nAll ${report.results.length} scenarios passed. productionWrites=${report.productionWrites}\n`
);
