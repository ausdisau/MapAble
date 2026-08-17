import type { CopilotWarning } from "@/lib/copilot/types";

type Props = {
  warnings: CopilotWarning[];
};

const levelStyles: Record<
  CopilotWarning["level"],
  { border: string; bg: string; icon: string }
> = {
  info: {
    border: "border-primary/30",
    bg: "bg-primary/5",
    icon: "ℹ️",
  },
  warning: {
    border: "border-amber-500/40",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    icon: "⚠️",
  },
  urgent: {
    border: "border-destructive/50",
    bg: "bg-destructive/10",
    icon: "🚨",
  },
};

export function CopilotWarnings({ warnings }: Props) {
  if (warnings.length === 0) return null;

  return (
    <ul className="space-y-2" aria-label="Important notices">
      {warnings.map((w, i) => {
        const style = levelStyles[w.level];
        return (
          <li
            key={`${w.level}-${i}`}
            className={`flex gap-3 rounded-lg border px-4 py-3 text-sm ${style.border} ${style.bg}`}
            role={w.level === "urgent" ? "alert" : "status"}
          >
            <span aria-hidden="true">{style.icon}</span>
            <span>{w.message}</span>
          </li>
        );
      })}
    </ul>
  );
}
