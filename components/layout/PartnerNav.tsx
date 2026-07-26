"use client";

import {
  BarChart3,
  Code2,
  LayoutDashboard,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";

export type PartnerNavLink = {
  href: string;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const LINKS: PartnerNavLink[] = [
  {
    href: "/partner",
    label: "Dashboard",
    description: "Partner overview and quick actions",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/partner/analytics",
    label: "Analytics & Data",
    description: "Accessibility impact and exports",
    icon: BarChart3,
  },
  {
    href: "/partner/developer",
    label: "Developer & API",
    description: "API keys and embed widgets",
    icon: Code2,
  },
  {
    href: "/partner/referrals",
    label: "Referrals",
    description: "Referral link and incentive tracking",
    icon: Share2,
  },
];

function isActive(pathname: string, link: PartnerNavLink): boolean {
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

/**
 * Navigation for the MapAble Partner Portal.
 * `sidebar` for desktop rail; `mobile` for compact horizontal nav.
 */
export function PartnerNav({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "mobile";
}) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav aria-label="Partner portal" className="overflow-x-auto px-3 py-2">
        <ul className="flex min-w-max gap-1">
          {LINKS.map((link) => {
            const active = isActive(pathname, link);
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-[#005B7F]/10 font-semibold text-[#005B7F]"
                      : "text-foreground hover:bg-muted/70",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Partner portal" className="flex h-full flex-col">
      <div className="border-b border-border/60 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Partner Portal
        </p>
        <p className="mt-1 text-sm font-semibold text-[#005B7F]">MapAble</p>
      </div>

      <ul className="flex flex-1 flex-col gap-1 p-3">
        {LINKS.map((link) => {
          const active = isActive(pathname, link);
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  active
                    ? "bg-[#005B7F]/10 font-semibold text-[#005B7F]"
                    : "text-foreground hover:bg-muted/70",
                )}
              >
                <Icon
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  <span className="block">{link.label}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {link.description}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border/60 p-4">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-[#005B7F] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Back to MapAble dashboard
        </Link>
      </div>
    </nav>
  );
}
