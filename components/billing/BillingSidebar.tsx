"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";
import {
  mapableNavLinkActiveClass,
  mapableNavLinkClass,
} from "@/lib/brand/styles";

import { BILLING_NAV_LINKS } from "./billing-nav";

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BillingSidebar({
  className,
}: {
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Billing Centre workspaces"
      className={cn(
        "w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:w-56 lg:w-64",
        className
      )}
    >
      <p className="mb-2 px-3 text-xs font-black uppercase tracking-wide text-[#005B7F]">
        Workspaces
      </p>
      <ul className="flex flex-col gap-0.5">
        {BILLING_NAV_LINKS.map((link) => {
          const active = isActive(pathname, link.href, link.exact);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block w-full",
                  active ? mapableNavLinkActiveClass : mapableNavLinkClass
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
