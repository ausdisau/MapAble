#!/usr/bin/env npx tsx
/**
 * Validates MapAble core and optional integration environment variables.
 * Never prints secret values.
 */
import {
  formatEnvIssues,
  validateAllEnv,
} from "../lib/env";

const result = validateAllEnv();

if (result.core.length > 0) {
  console.error("Core environment issues:\n");
  console.error(formatEnvIssues(result.core));
}

if (result.integrations.length > 0) {
  console.error("\nIntegration environment issues:\n");
  console.error(formatEnvIssues(result.integrations));
}

if (result.ok) {
  console.log("All required environment variables are present.");
  process.exit(0);
}

console.error(
  "\nFix missing variables or disable integrations you are not using."
);
process.exit(1);
