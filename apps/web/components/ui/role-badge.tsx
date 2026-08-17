import { cn } from "@/app/lib/utils";
import { roleLabel } from "@/lib/auth/roles";
import type { UserRole } from "@/types/mapable";


export function RoleBadge({
  role,
  className,
}: {
  role: UserRole | string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium",
        className
      )}
    >
      {roleLabel(role as UserRole)}
    </span>
  );
}
