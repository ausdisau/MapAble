function enabled(name: string) {
  return process.env[name] === "true";
}

/**
 * CareOS Phase 9 — MapAble Moves rehabilitation coordination.
 * Non-prescriptive: clinician-authored plans, activities, optional device data.
 * Clinical AI boundaries are hardcoded off — diagnose/prescribe/alter treatment
 * and intensity auto-increase are never permitted.
 */
export const movesRehabilitationConfig = {
  enabled: enabled("MAPABLE_MOVES_REHABILITATION_ENABLED"),
  telehealthEnabled: enabled("MAPABLE_MOVES_TELEHEALTH_ENABLED"),
  deviceImportEnabled: enabled("MAPABLE_MOVES_DEVICE_IMPORT_ENABLED"),
  /** Safety: CareOS must NOT diagnose. */
  diagnoseEnabled: false,
  /** Safety: CareOS must NOT prescribe. */
  prescribeEnabled: false,
  /** Safety: CareOS must NOT alter treatment autonomously. */
  alterTreatmentEnabled: false,
  /** Safety: CareOS must NOT increase exercise intensity automatically. */
  intensityAutoIncreaseEnabled: false,
} as const;

export type MovesRehabilitationConfig = typeof movesRehabilitationConfig;

export function ensureMovesRehabilitationEnabled() {
  if (!movesRehabilitationConfig.enabled) {
    throw new Error("MOVES_REHABILITATION_DISABLED");
  }
}
