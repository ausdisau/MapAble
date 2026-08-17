export function ExportSafetyNotice() {
  return (
    <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">
      Exports are audited. Participant-level data requires a documented purpose.
      Low-count cohorts may be suppressed to reduce re-identification risk.
    </p>
  );
}
