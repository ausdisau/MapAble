import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { canAccessBillingCentre } from "@/lib/billing/permissions";

export default async function BillingIndexPage() {
  const user = await requireAuth();
  if (!canAccessBillingCentre(user.primaryRole)) {
    redirect("/dashboard");
  }
  redirect("/billing/overview");
}
