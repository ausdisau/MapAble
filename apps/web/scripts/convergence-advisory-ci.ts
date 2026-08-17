/**
 * ConvergenceOS advisory CI entrypoint.
 * Never auto-merges. Exit 0 in advisory/disabled modes.
 */
import {
  evaluateAdvisoryCiFindings,
} from "@/lib/platform/convergence-os/ci/advisory-gate";

function main() {
  const result = evaluateAdvisoryCiFindings();

  if (result.mode === "disabled") {
    console.log(
      "ConvergenceOS CI gate disabled (MAPABLE_CONVERGENCE_OS_ENABLED / MAPABLE_CONVERGENCE_CI_GATE_ENABLED)."
    );
    process.exit(0);
  }

  console.log(`ConvergenceOS CI mode: ${result.mode}`);
  console.log(`Findings analysed: ${result.findings.length}`);

  for (const w of result.warnings) {
    console.warn(`WARNING: ${w}`);
  }
  for (const b of result.blockers) {
    console.error(`BLOCKER: ${b}`);
  }

  if (result.mode === "advisory") {
    console.log(
      "Advisory only — exit 0. Humans must review before merge. Auto-merge remains disabled."
    );
  }

  process.exit(result.exitCode);
}

main();
