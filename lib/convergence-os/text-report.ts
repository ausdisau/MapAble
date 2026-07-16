type ReportInput = {
  snapshotId: string;
  baseCommitSha: string;
  scannedAt: Date | string;
  domainCount: number;
  prCount: number;
  dependencyCount: number;
  collisionCount: number;
  criticalCollisions: string[];
  mergeTrainName?: string;
  warningLabels: string[];
};

/** Plain-language downloadable report — accessible alternative to graphs. */
export function buildConvergenceTextReport(input: ReportInput): string {
  const scanned =
    typeof input.scannedAt === "string"
      ? input.scannedAt
      : input.scannedAt.toISOString();

  const lines = [
    "MapAble ConvergenceOS — repository audit report",
    "Mode: AUDIT / ADVISORY only. No automated merges or migrations.",
    "",
    `Snapshot ID: ${input.snapshotId}`,
    `Base commit: ${input.baseCommitSha}`,
    `Scanned at: ${scanned}`,
    "",
    "Inventory",
    `  Canonical domains: ${input.domainCount}`,
    `  Pull requests: ${input.prCount}`,
    `  Dependencies: ${input.dependencyCount}`,
    `  Schema/migration collisions: ${input.collisionCount}`,
    "",
    "Critical collisions",
    ...(input.criticalCollisions.length
      ? input.criticalCollisions.map((c) => `  - ${c}`)
      : ["  (none)"]),
    "",
    "Warning labels observed",
    ...(input.warningLabels.length
      ? input.warningLabels.map((w) => `  - ${w}`)
      : ["  (none)"]),
    "",
    input.mergeTrainName
      ? `Advisory merge train: ${input.mergeTrainName}`
      : "Advisory merge train: (not generated)",
    "",
    "Human authority",
    "  Cursor and AI agents may propose architecture.",
    "  ConvergenceOS records and validates architecture.",
    "  Authorised humans approve canonical decisions.",
    "  GitHub and CI execute repository changes.",
    "",
  ];

  return lines.join("\n");
}
