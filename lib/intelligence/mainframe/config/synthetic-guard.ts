import { isSyntheticMainframeEnabled } from "./feature-flags";

export class SyntheticMainframeError extends Error {
  constructor(
    public readonly code:
      | "MAINFRAME_DISABLED"
      | "SYNTHETIC_ONLY_REQUIRED"
      | "SYNTHETIC_CLASSIFICATION_REQUIRED"
  ) {
    super(code);
    this.name = "SyntheticMainframeError";
  }
}

export function assertSyntheticOnly(dataClassification: string): void {
  if (!isSyntheticMainframeEnabled()) {
    throw new SyntheticMainframeError("MAINFRAME_DISABLED");
  }
  if (dataClassification !== "SYNTHETIC") {
    throw new SyntheticMainframeError("SYNTHETIC_CLASSIFICATION_REQUIRED");
  }
}
