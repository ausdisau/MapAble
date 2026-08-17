import { cn } from "@/app/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  mapableEyebrowBadgeClass,
  mapableEyebrowBadgeSecondaryClass,
} from "@/lib/brand/styles";

const STATUS_STYLES: Record<string, string> = {
  paid: mapableEyebrowBadgeSecondaryClass,
  pending_payment: mapableEyebrowBadgeClass,
  draft: "border-border/60 bg-muted/50 text-muted-foreground",
  issued: mapableEyebrowBadgeClass,
  exported: mapableEyebrowBadgeSecondaryClass,
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
  refunded: "border-border/60 bg-muted text-muted-foreground",
  cancelled: "border-border/60 bg-muted text-muted-foreground",
};

export function BillingStatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", STATUS_STYLES[status] ?? mapableEyebrowBadgeClass)}
    >
      {label}
    </Badge>
  );
}
