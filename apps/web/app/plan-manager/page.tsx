import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";

export default async function PlanManagerHomePage() {
  await requirePermission("plan_manager:portal");

  return (
    <div className="space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Plan manager portal</h1>
      <p className="text-muted-foreground">
        Review invoices and raise queries. Does not submit claims to NDIA or PACE.
      </p>
      <Link href="/plan-manager/invoices" className="text-primary underline">
        Invoices
      </Link>
    </div>
  );
}
