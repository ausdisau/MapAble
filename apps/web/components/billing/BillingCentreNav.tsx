"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";

const LINKS = [
  { href: "/billing/overview", label: "Overview", exact: true },
  { href: "/billing/invoices", label: "Invoices & payments" },
  { href: "/dashboard/billing/funding", label: "Funding sources" },
  { href: "/dashboard/billing/legacy", label: "Invoice drafts (legacy)" },
];

/**
 * Legacy horizontal nav used under /dashboard/billing/*.
 * Primary Billing Centre navigation is now `/billing/*` via BillingSidebar.
 */
export function BillingCentreNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Invoice and billing centre"
      className="flex flex-wrap gap-2 border-b border-border pb-4"
    >
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href || pathname === "/dashboard/billing"
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
