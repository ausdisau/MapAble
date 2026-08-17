import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";

/** Legacy dashboard billing entry — Billing Centre now lives under /billing. */
export default async function DashboardBillingRedirectPage() {
  await requireAuth();
  redirect("/billing/overview");
}
