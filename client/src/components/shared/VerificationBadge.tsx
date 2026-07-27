import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  label?: string;
  verified?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function VerificationBadge({
  label = "NDIS Verified",
  verified = true,
  className,
  ...props
}: VerificationBadgeProps) {
  if (!verified) return null;
  return (
    <Badge
      className={cn(
        "gap-1.5 font-semibold border-transparent bg-success text-success-foreground no-default-hover-elevate no-default-active-elevate",
        className,
      )}
      data-testid={props["data-testid"] ?? "badge-verified"}
    >
      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
      {label}
    </Badge>
  );
}
