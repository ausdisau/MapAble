import {
  BillingEmptyState,
  BillingPageHeader,
} from "@/components/billing/BillingPageChrome";
import { PolicyValidationPanel } from "@/components/billing/PolicyValidationPanel";
import { requireAuth } from "@/lib/auth/guards";

export default async function BillingPolicyPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Pricing policy"
        description="Active rate cards, caps, and travel rules used when drafting invoices."
      />

      <PolicyValidationPanel
        result={{
          ok: true,
          status: "ok",
          policyVersionId: undefined,
          messages: [
            "No organisation policy version selected for this session.",
            "Attach a policy version on invoice drafts before issuing.",
          ],
          capsExceeded: false,
        }}
      />

      <BillingEmptyState title="Policy versions">
        Manage published pricing policy versions from admin once your
        organisation has them configured. Version IDs appear on invoice line
        items for audit.
      </BillingEmptyState>
    </div>
  );
}
