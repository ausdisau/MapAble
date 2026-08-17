import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import {
  getBudgetSnapshot,
  NON_ADVISORY_DISCLAIMER,
} from "@/lib/budget/budget-guidance-service";

export default async function BudgetGuidancePage() {
  const user = await requireAuth();
  const snapshot = await getBudgetSnapshot(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Budget visibility</h1>
      <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        {NON_ADVISORY_DISCLAIMER}
      </p>

      {!snapshot.enabled ? (
        <p className="text-sm text-muted-foreground">
          Budget guidance is not enabled in this environment.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Plan status</p>
              <p className="font-medium">{snapshot.planStatus}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Overall band</p>
              <p className="font-medium">{snapshot.overallBudgetBand}</p>
            </div>
          </div>

          <section>
            <h2 className="font-medium">Categories</h2>
            <ul className="mt-2 space-y-3">
              {snapshot.categories?.map((c) => (
                <li key={c.category} className="rounded-lg border p-3">
                  <p className="font-medium">{c.category}</p>
                  <p className="text-sm text-muted-foreground">Band: {c.band}</p>
                  <p className="mt-1 text-sm">{c.description}</p>
                </li>
              ))}
            </ul>
          </section>

          <Link href="/plan-manager/invoices" className="text-sm text-primary underline">
            View invoices with your plan manager
          </Link>
        </>
      )}
    </div>
  );
}
