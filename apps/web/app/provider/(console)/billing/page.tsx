import { ProviderBillingClient } from "@/components/billing/ProviderBillingClient";
import { Badge } from "@/components/ui/badge";
import { mapableEyebrowBadgeClass, mapablePageContainerClass } from "@/lib/brand/styles";

export const metadata = {
  title: "Provider billing | MapAble",
};

export default function ProviderBillingPage() {
  return (
    <div className={mapablePageContainerClass}>
      <div className="mx-auto max-w-3xl py-8">
        <Badge variant="outline" className={mapableEyebrowBadgeClass}>
          Provider console
        </Badge>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          Billing & <span className="text-primary">payouts</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Connect your Stripe account for payouts, manage subscriptions, and review transfers.
        </p>
        <div className="mt-10">
          <ProviderBillingClient />
        </div>
      </div>
    </div>
  );
}
