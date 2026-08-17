import { StatusBadge } from "@/components/ui/status-badge";

export function SupportTicketStatusPanel({
  status,
  priority,
  isSafeguarding,
}: {
  status: string;
  priority: string;
  isSafeguarding?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge status={status} />
      <span className="text-sm">
        Priority: <strong>{priority}</strong>
      </span>
      {isSafeguarding ? (
        <span
          role="alert"
          className="rounded-md border-2 border-destructive bg-destructive/10 px-3 py-1 text-sm font-semibold text-destructive"
        >
          Safeguarding concern — admin review required
        </span>
      ) : null}
    </div>
  );
}
