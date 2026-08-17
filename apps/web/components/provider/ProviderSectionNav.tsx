"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";
import { mapableNavLinkActiveClass, mapableNavLinkClass } from "@/lib/brand/styles";

export type SectionNavLink = { href: string; label: string };

export function ProviderSectionNav({
  links,
  ariaLabel,
}: {
  links: SectionNavLink[];
  ariaLabel: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap gap-2 border-b border-border pb-4">
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              active ? mapableNavLinkActiveClass : mapableNavLinkClass
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
