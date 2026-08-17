"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/app/lib/utils";
import {
  mapableNavLinkActiveClass,
  mapableNavLinkClass,
  mapableRoleNavBarClass,
} from "@/lib/brand/styles";

export type MapAbleRoleNavLink = {
  href: string;
  label: string;
  exact?: boolean;
  matchPrefix?: string;
};

export function MapAbleRoleNav({
  label,
  title,
  links,
  trailing,
}: {
  label: string;
  title?: string;
  links: MapAbleRoleNavLink[];
  trailing?: ReactNode;
}) {
  const pathname = usePathname();

  function isActive(link: MapAbleRoleNavLink) {
    if (link.exact) return pathname === link.href;
    const prefix = link.matchPrefix ?? link.href;
    return pathname === link.href || pathname.startsWith(`${prefix}/`);
  }

  return (
    <nav aria-label={label} className={mapableRoleNavBarClass}>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        {title ? (
          <p className="mapable-display text-sm font-black text-[#005B7F]">{title}</p>
        ) : null}
        <ul className="flex flex-1 flex-wrap gap-1">
          {links.map((link) => {
            const active = isActive(link);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(active ? mapableNavLinkActiveClass : mapableNavLinkClass)}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
        {trailing}
      </div>
    </nav>
  );
}
