import { cn } from "@/app/lib/utils";
import { Badge } from "@/components/ui/badge";
import { plainLanguageStatus } from "@/lib/billing/invoicing/state-machine";
import {
  mapableEyebrowBadgeClass,
  mapableEyebrowBadgeSecondaryClass,
} from "@/lib/brand/styles";
import type { BillingInvoiceState } from "@/types/billing";

const STATUS_STYLES: Partial<Record<BillingInvoiceState, string>> = {
  paid: mapableEyebrowBadgeSecondaryClass,
  pending_payment: mapableEyebrowBadgeClass,
  draft: "border-border/60 bg-muted/50 text-muted-foreground",
  issued: mapableEyebrowBadgeClass,
  sent: mapableEyebrowBadgeClass,
  exported: mapableEyebrowBadgeSecondaryClass,
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
  overdue: "border-destructive/30 bg-destructive/10 text-destructive",
  disputed: "border-amber-500/30 bg-amber-50 text-amber-900",
  refunded: "border-border/60 bg-muted text-muted-foreground",
  cancelled: "border-border/60 bg-muted text-muted-foreground",
  void: "border-border/60 bg-muted text-muted-foreground",
};

type InvoiceStatusBadgeProps = {
  status: BillingInvoiceState | string;
  /** Show plain-language description beside the badge. Default true. */
  showDescription?: boolean;
  className?: string;
};

export function InvoiceStatusBadge({
  status,
  showDescription = true,
  className,
}: InvoiceStatusBadgeProps) {
  const shortLabel = status.replace(/_/g, " ");
  const description = (() => {
    try {
      return plainLanguageStatus(status as BillingInvoiceState);
    } catch {
      return shortLabel;
    }
  })();

  return (
    <span
      className={cn("inline-flex flex-wrap items-center gap-2", className)}
      role="status"
      aria-label={description}
    >
      <Badge
        variant="outline"
        className={cn(
          "capitalize",
          STATUS_STYLES[status as BillingInvoiceState] ?? mapableEyebrowBadgeClass
        )}
      >
        {shortLabel}
      </Badge>
      {showDescription ? (
        <span className="text-sm text-slate-600">{description}</span>
      ) : null}
    </span>
  );
}
