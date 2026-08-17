import { AdminBillingClient } from "@/components/billing/AdminBillingClient";
import { Badge } from "@/components/ui/badge";
import { mapableEyebrowBadgeClass, mapablePageContainerClass } from "@/lib/brand/styles";

export const metadata = {
  title: "Admin billing | MapAble",
};

export default function AdminBillingPage() {
  return (
    <div className={mapablePageContainerClass}>
      <div className="mx-auto max-w-5xl py-8">
        <Badge variant="outline" className={mapableEyebrowBadgeClass}>
          Admin console
        </Badge>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          Billing <span className="text-primary">operations</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Search invoices, review failed payments, disputes, and export errors.
        </p>
        <div className="mt-10">
          <AdminBillingClient />
        </div>
      </div>
    </div>
  );
}
