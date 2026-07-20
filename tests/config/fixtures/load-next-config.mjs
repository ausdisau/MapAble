/**
 * Child-process helper: import next.config.ts so assertDeployedProductionEnv runs.
 * Prints NEXT_CONFIG_OK on success; non-zero exit on validation failure.
 */
try {
  await import("../../../next.config.ts");
  process.stdout.write("NEXT_CONFIG_OK\n");
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
