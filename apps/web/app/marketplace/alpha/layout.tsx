import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import {
  alphaGateFromEnvironment,
  canAccessMarketplaceAlpha,
} from "@/lib/marketplace/alpha-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Marketplace closed alpha",
  robots: { index: false, follow: false },
};

/**
 * Isolated from the old /marketplace/browse cart and invoice routes.
 * Never activate MAPABLE_MARKETPLACE_ENABLED to open this prototype.
 */
export default async function MarketplaceAlphaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gate = alphaGateFromEnvironment();
  if (!gate.enabled) notFound();

  const user = await requireAuth();
  if (!canAccessMarketplaceAlpha(user, gate)) notFound();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-white">
        <nav
          aria-label="Closed-alpha demonstration pages"
          className="mx-auto flex max-w-6xl flex-wrap gap-3 px-4 py-4"
        >
          <Link className="inline-flex min-h-11 items-center rounded-lg px-3 font-semibold underline focus-visible:outline focus-visible:outline-4" href="/marketplace/alpha">
            Catalogue
          </Link>
          <Link className="inline-flex min-h-11 items-center rounded-lg px-3 font-semibold underline focus-visible:outline focus-visible:outline-4" href="/marketplace/alpha/inclusive">
            Compare access features
          </Link>
          <Link className="inline-flex min-h-11 items-center rounded-lg px-3 font-semibold underline focus-visible:outline focus-visible:outline-4" href="/marketplace/alpha/assurance">
            Supplier-to-refund simulation
          </Link>
          <Link className="inline-flex min-h-11 items-center rounded-lg px-3 font-semibold underline focus-visible:outline focus-visible:outline-4" href="/marketplace">
            Public programme information
          </Link>
        </nav>
      </header>
      <aside aria-label="Closed-alpha safeguards" className="mx-auto max-w-6xl px-4 pt-4">
        <p className="rounded-lg border-2 border-amber-600 bg-amber-50 p-4 text-base font-semibold text-amber-950">
          Closed alpha — fictional catalogue and actors. No real orders, funding eligibility, invoices, payments, contracts, stock or permissions are created.
        </p>
      </aside>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
