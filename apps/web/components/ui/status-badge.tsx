import { cn } from "@/app/lib/utils";

const VARIANTS: Record<string, { className: string; label: string }> = {
  draft: { className: "bg-muted text-muted-foreground", label: "Draft" },
  submitted: {
    className: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100",
    label: "Submitted",
  },
  awaiting_admin_review: {
    className: "bg-amber-100 text-amber-900",
    label: "Under review",
  },
  awaiting_provider_response: {
    className: "bg-amber-100 text-amber-900",
    label: "Awaiting provider",
  },
  matched: {
    className: "bg-indigo-100 text-indigo-900",
    label: "Matched",
  },
  accepted: {
    className: "bg-green-100 text-green-900",
    label: "Accepted",
  },
  requested: {
    className: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100",
    label: "Requested",
  },
  awaiting_provider_acceptance: {
    className: "bg-amber-100 text-amber-900",
    label: "Awaiting provider",
  },
  confirmed: {
    className: "bg-green-100 text-green-900",
    label: "Confirmed",
  },
  in_progress: {
    className: "bg-indigo-100 text-indigo-900",
    label: "In progress",
  },
  completed: {
    className: "bg-green-100 text-green-900",
    label: "Completed",
  },
  cancelled: {
    className: "bg-muted text-muted-foreground",
    label: "Cancelled",
  },
  disputed: {
    className: "bg-red-100 text-red-900",
    label: "Disputed",
  },
  active: { className: "bg-green-100 text-green-900", label: "Active" },
  revoked: { className: "bg-red-100 text-red-900", label: "Revoked" },
  expired: { className: "bg-muted text-muted-foreground", label: "Expired" },
  pending: { className: "bg-amber-100 text-amber-900", label: "Pending" },
  verified: { className: "bg-green-100 text-green-900", label: "Verified" },
  not_started: {
    className: "bg-muted text-muted-foreground",
    label: "Not started",
  },
  pending_review: {
    className: "bg-amber-100 text-amber-900",
    label: "Pending review",
  },
  rejected: { className: "bg-red-100 text-red-900", label: "Rejected" },
  suspended: { className: "bg-red-100 text-red-900", label: "Suspended" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variant = VARIANTS[status] ?? {
    className: "bg-muted text-muted-foreground",
    label: status.replace(/_/g, " "),
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium",
        variant.className,
        className
      )}
    >
      <span aria-hidden="true" className="mr-1.5 size-2 rounded-full bg-current opacity-60" />
      {variant.label}
    </span>
  );
}
