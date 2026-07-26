import { isAtContinuityEnabled } from "@/lib/config/at-continuity";

export class AtContinuityDisabledError extends Error {
  readonly status = 503;

  constructor(message = "Assistive Technology Continuity is not enabled") {
    super(message);
    this.name = "AtContinuityDisabledError";
  }
}

export function assertAtContinuityEnabled(): void {
  if (!isAtContinuityEnabled()) {
    throw new AtContinuityDisabledError();
  }
}

export { isAtContinuityEnabled };
