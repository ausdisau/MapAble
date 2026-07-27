import type { WorkerCredentialStatus } from "@prisma/client";

export const AU_JURISDICTIONS = [
  "NSW",
  "VIC",
  "QLD",
  "SA",
  "WA",
  "TAS",
  "ACT",
  "NT",
] as const;

export type AuJurisdiction = (typeof AU_JURISDICTIONS)[number];

export type ScreeningSubmissionView = {
  id: string;
  workerProfileId: string;
  workerName: string;
  jurisdiction: string;
  submittedAt: string;
  status: "Pending" | "Verified" | "Rejected" | "Expired" | "Not provided";
  documentId: string | null;
};

export function isJurisdiction(value: string): value is AuJurisdiction {
  return (AU_JURISDICTIONS as readonly string[]).includes(value);
}

export function screeningStatusLabel(
  status: WorkerCredentialStatus,
): ScreeningSubmissionView["status"] {
  switch (status) {
    case "verified":
      return "Verified";
    case "rejected":
      return "Rejected";
    case "expired":
      return "Expired";
    case "pending_review":
      return "Pending";
    case "not_provided":
      return "Not provided";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
