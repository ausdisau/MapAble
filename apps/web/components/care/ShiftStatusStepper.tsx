import { StatusBadge } from "@/components/ui/status-badge";

const SHIFT_STEPS = [
  "scheduled",
  "worker_assigned",
  "confirmed",
  "worker_en_route",
  "checked_in",
  "in_progress",
  "checked_out",
  "awaiting_participant_approval",
  "approved",
  "completed",
] as const;

export function ShiftStatusStepper({ status }: { status: string }) {
  const idx = SHIFT_STEPS.indexOf(status as (typeof SHIFT_STEPS)[number]);
  return (
    <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" aria-label="Shift progress">
      {SHIFT_STEPS.map((step, i) => {
        const done = idx >= 0 && i <= idx;
        const current = step === status;
        return (
          <li
            key={step}
            className={`flex items-center gap-2 text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                current
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-muted"
                    : "border border-muted"
              }`}
              aria-current={current ? "step" : undefined}
            >
              {i + 1}
            </span>
            <StatusBadge status={step} />
          </li>
        );
      })}
    </ol>
  );
}
