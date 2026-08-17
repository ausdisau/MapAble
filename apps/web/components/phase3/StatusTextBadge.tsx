const LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  awaiting_admin_review: "Awaiting admin review",
  awaiting_provider_response: "Awaiting provider",
  confirmed: "Confirmed",
  scheduled: "Scheduled",
  approved: "Approved",
  published: "Published",
  requested: "Requested",
};

export function StatusTextBadge({ status }: { status: string }) {
  const label = LABELS[status] ?? status.replace(/_/g, " ");
  return (
    <span className="inline-flex min-h-8 items-center rounded-md border border-border bg-muted px-2 text-sm font-medium capitalize">
      <span className="sr-only">Status: </span>
      {label}
    </span>
  );
}
