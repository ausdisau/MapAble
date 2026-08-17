import { cn } from "@/app/lib/utils";

export type AuthAlertVariant = "error" | "success" | "warning" | "info";

const variantClass: Record<AuthAlertVariant, string> = {
  error: "border-destructive/30 bg-destructive/5 text-destructive",
  success:
    "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200",
  warning:
    "border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-100",
  info: "border-primary/30 bg-primary/5 text-foreground",
};

export function AuthAlert({
  variant,
  children,
  className,
}: {
  variant: AuthAlertVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      role="alert"
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        variantClass[variant],
        className
      )}
    >
      {children}
    </p>
  );
}
