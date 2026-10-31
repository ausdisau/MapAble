import { ExchangeWorkspace } from "@/components/marketplace/dual-sided/ExchangeWorkspace";

export const metadata = {
  title: "Buyer–seller Exchange | MapAble Marketplace design lab",
  description:
    "Synthetic, participant-controlled buyer, supplier, provider, prescriber and support-coordinator workflow. No real commerce.",
  robots: { index: false, follow: false },
};

/**
 * Inherits requireAuth and default-off MAPABLE_COMMERCE_DESIGN_LAB_ENABLED
 * from the parent design-lab layout. Does not use the Marketplace payment gate.
 */
export default function MarketplaceExchangePage() {
  return <ExchangeWorkspace />;
}
