import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BillingShell } from "@/components/billing/BillingShell";
import { AuthenticatedRoleAppShell } from "@/components/layout/AuthenticatedRoleAppShell";
import { requireAuth } from "@/lib/auth/guards";
import { canAccessBillingCentre } from "@/lib/billing/permissions";
import { mapableRoleNavBarClass } from "@/lib/brand/styles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Billing Centre | MapAble",
  description:
    "MapAble Billing Centre — invoices, claims, payments, and finance workspaces",
};

function BillingSecondaryNav() {
  return (
    <div className={mapableRoleNavBarClass}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="mapable-display text-sm font-black text-[#005B7F]">
          Billing Centre
        </p>
        <nav aria-label="Billing Centre shortcuts" className="flex flex-wrap gap-3">
          <Link
            href="/billing/overview"
            className="text-sm font-bold text-slate-600 hover:text-[#005B7F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
          >
            Overview
          </Link>
          <Link
            href="/billing/invoices"
            className="text-sm font-bold text-slate-600 hover:text-[#005B7F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
          >
            Invoices
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-black text-[#005B7F] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default async function BillingCentreLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAuth();
  if (!canAccessBillingCentre(user.primaryRole)) {
    redirect("/dashboard");
  }

  return (
    <AuthenticatedRoleAppShell
      user={user}
      headerTitle="Billing Centre"
      logoHref="/billing/overview"
      secondaryNav={<BillingSecondaryNav />}
    >
      <BillingShell>{children}</BillingShell>
    </AuthenticatedRoleAppShell>
  );
}
