/**
 * I-CAN v6 participant intake — Year-One scaffold.
 * Flag off by default; enabling is not an NDIA submission claim.
 */
export function isICanIntakeEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.MAPABLE_ICAN_INTAKE_ENABLED === "true";
}
