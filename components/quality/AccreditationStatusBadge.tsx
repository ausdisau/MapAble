import type { ProviderAccreditationApplicationStatus } from "@prisma/client";

const STATUS_LABELS: Record<ProviderAccreditationApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  clarification_requested: "Clarification requested",
  assessment_in_progress: "Assessment in progress",
  pending_decision: "Pending decision",
  approved: "Approved",
  conditionally_approved: "Conditionally approved",
  rejected: "Rejected",
  suspended: "Suspended",
  expired: "Expired",
  renewal_due: "Renewal due",
  appealed: "Appealed",
  withdrawn: "Withdrawn",
};

export function AccreditationStatusBadge({
  status,
}: {
  status: ProviderAccreditationApplicationStatus | string;
}) {
  const label =
    STATUS_LABELS[status as ProviderAccreditationApplicationStatus] ?? status;
  return (
    <span className="inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize">
      {label}
    </span>
  );
}
