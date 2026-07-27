import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "success" | "warning" | "info" | "destructive" | "pending";

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  icon?: React.ComponentType<{ className?: string }>;
  pulse?: boolean;
  className?: string;
  "data-testid"?: string;
}

const toneMap: Record<StatusTone, string> = {
  neutral: "border-transparent bg-secondary text-secondary-foreground",
  success: "border-transparent bg-success/15 text-success",
  warning: "border-transparent bg-warning/15 text-warning",
  info: "border-transparent bg-info/15 text-info",
  destructive: "border-transparent bg-destructive/15 text-destructive",
  pending: "border-transparent bg-brand-gold/15 text-brand-gold",
};

export function StatusBadge({
  label,
  tone = "neutral",
  icon: Icon,
  pulse,
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        "gap-1.5 font-semibold no-default-hover-elevate no-default-active-elevate",
        toneMap[tone],
        className,
      )}
      data-testid={props["data-testid"]}
    >
      {Icon && (
        <Icon className={cn("w-3.5 h-3.5 shrink-0", pulse && "animate-status-pulse")} />
      )}
      {label}
    </Badge>
  );
}
