import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  tone?: "default" | "error";
  "data-testid"?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  tone = "default",
  ...props
}: EmptyStateProps) {
  return (
    <Card
      className={cn("p-10 md:p-12 text-center flex flex-col items-center", className)}
      data-testid={props["data-testid"] ?? "empty-state"}
    >
      {Icon && (
        <div
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center mb-4",
            tone === "error" ? "bg-destructive/10" : "bg-muted",
          )}
        >
          <Icon
            className={cn(
              "w-7 h-7",
              tone === "error" ? "text-destructive" : "text-muted-foreground",
            )}
          />
        </div>
      )}
      <h3 className="text-h4">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-md">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
