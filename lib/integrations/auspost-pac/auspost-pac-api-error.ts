import type { AusPostPacErrorCode } from "@/types/auspost-pac";

const STATUS_BY_CODE: Record<AusPostPacErrorCode, number> = {
  AUSPOST_PAC_NOT_CONFIGURED: 503,
  AUSPOST_PAC_UPSTREAM_ERROR: 502,
  AUSPOST_PAC_VALIDATION_ERROR: 400,
};

const PLAIN_MESSAGES: Record<AusPostPacErrorCode, string> = {
  AUSPOST_PAC_NOT_CONFIGURED:
    "Australia Post address lookup is not configured. Set AUSPOST_PAC_API_KEY on the server.",
  AUSPOST_PAC_UPSTREAM_ERROR:
    "Australia Post could not complete the request. Please try again later.",
  AUSPOST_PAC_VALIDATION_ERROR: "The request was invalid. Please check your input.",
};

export class AusPostPacApiError extends Error {
  constructor(
    public code: AusPostPacErrorCode,
    message?: string,
    public details?: unknown,
  ) {
    super(message ?? PLAIN_MESSAGES[code]);
    this.name = "AusPostPacApiError";
  }

  get httpStatus(): number {
    return STATUS_BY_CODE[this.code];
  }
}

export function auspostPacNotConfiguredError() {
  return new AusPostPacApiError("AUSPOST_PAC_NOT_CONFIGURED");
}

export function auspostPacUpstreamError(status: number, detail?: string) {
  return new AusPostPacApiError(
    "AUSPOST_PAC_UPSTREAM_ERROR",
    detail ?? `Australia Post API returned status ${status}.`,
    { upstreamStatus: status },
  );
}
