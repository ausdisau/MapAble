import { BillingInvoicesClient } from "@/components/billing/BillingInvoicesClient";
import { requireAuth } from "@/lib/auth/guards";

export default async function BillingInvoicesPage() {
  await requireAuth();
  return <BillingInvoicesClient />;
}
