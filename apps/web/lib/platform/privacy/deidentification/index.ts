export {
  ALWAYS_SUPPRESSED_FIELDS,
  suppressSensitiveFields,
  type SuppressionResult,
} from "./field-suppression";
export {
  describeDeidentificationLevel,
  isPseudonym,
  pseudonymiseParticipantId,
} from "./pseudonymisation";
export {
  applySmallCellControls,
  shouldSuppressCohort,
  SMALL_CELL_THRESHOLD,
  type SmallCellResult,
} from "./small-cell-controls";
