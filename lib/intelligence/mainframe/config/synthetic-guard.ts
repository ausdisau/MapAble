import { isSyntheticMainframeEnabled } from "./feature-flags";

export class SyntheticMainframeError extends Error {
  constructor(
    public readonly code:
      | "MAINFRAME_DISABLED"
      | "SYNTHETIC_ONLY_REQUIRED"
      | "SYNTHETIC_CLASSIFICATION_REQUIRED"
      | "SYNTHETIC_CONTEXT_EXPIRED"
  ) {
    super(code);
    this.name = "SyntheticMainframeError";
  }
}

export function assertSyntheticOnly(params: {
  dataClassification: string;
  expiresAt: string;
}): void {
  if (!isSyntheticMainframeEnabled()) {
    throw new SyntheticMainframeError("MAINFRAME_DISABLED");
  }
  if (params.dataClassification !== "SYNTHETIC") {
    throw new SyntheticMainframeError("SYNTHETIC_CLASSIFICATION_REQUIRED");
  }
  if (new Date(params.expiresAt) <= new Date()) {
    throw new SyntheticMainframeError("SYNTHETIC_CONTEXT_EXPIRED");
  }
}
