import Link from "next/link";

import { QuarterlyPacingAlertScaffold } from "@/components/billing/QuarterlyPacingAlertScaffold";
import { CoreHubCard } from "@/components/core/CoreHubCard";
import { ProviderSectionNav } from "@/components/provider/ProviderSectionNav";
import { isPaceQuarterlyPacingEnabled } from "@/lib/config/strategic-2026";
import { PROVIDER_CLAIMING_LINKS } from "@/lib/platform/core-ui/provider-section-nav";

export const metadata = { title: "Claiming | MapAble Provider" };

export default function ProviderClaimingHubPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Claiming</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          NDIS plan-managed and NDIA agency-managed claiming use separate workflows.
          Choose the path that matches your participants&apos; funding.
        </p>
      </header>

      <ProviderSectionNav links={PROVIDER_CLAIMING_LINKS} ariaLabel="Claiming paths" />

      <div className="grid gap-4 sm:grid-cols-2">
        <CoreHubCard
          href="/provider/ndis-claims/ready"
          title="NDIS plan-managed"
          description="Portal-assisted direct claiming — ready to claim, batches, reconciliation"
        />
        <CoreHubCard
          href="/provider/ndia-claims"
          title="NDIA direct claiming"
          description="Agency-managed participants via NDIA partner API credentials"
        />
      </div>

      {isPaceQuarterlyPacingEnabled() ? <QuarterlyPacingAlertScaffold /> : null}

      <p className="text-sm text-muted-foreground">
        <Link href="/provider/billing" className="text-primary underline">
          Billing &amp; payouts
        </Link>{" "}
        covers Stripe and organisation invoices separate from NDIA/NDIS claim submission.
      </p>
    </div>
  );
}
