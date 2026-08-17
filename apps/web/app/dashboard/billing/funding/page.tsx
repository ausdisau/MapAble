import { BillingFundingListClient } from "@/components/billing/BillingFundingListClient";
import { requireAuth } from "@/lib/auth/guards";

export default async function BillingFundingPage() {
  await requireAuth();
  return <BillingFundingListClient />;
}
