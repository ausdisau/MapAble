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

export type MapAbleRoleNavGroup = {
  id: string;
  label: string;
  links: MapAbleRoleNavLink[];
};

export function MapAbleRoleNav({
  label,
  title,
  links,
  groups,
  trailing,
}: {
  label: string;
  title?: string;
  links?: MapAbleRoleNavLink[];
  groups?: MapAbleRoleNavGroup[];
  trailing?: ReactNode;
}) {
  const pathname = usePathname();

  function isActive(link: MapAbleRoleNavLink) {
    if (link.exact) return pathname === link.href;
    const prefix = link.matchPrefix ?? link.href;
    return pathname === link.href || pathname.startsWith(`${prefix}/`);
  }

  function renderLink(link: MapAbleRoleNavLink) {
    const active = isActive(link);
    return (
      <li key={`${link.href}:${link.label}`}>
        <Link
          href={link.href}
          aria-current={active ? "page" : undefined}
          className={cn(active ? mapableNavLinkActiveClass : mapableNavLinkClass)}
        >
          {link.label}
        </Link>
      </li>
    );
  }

  const resolvedGroups =
    groups && groups.length > 0
      ? groups
      : links && links.length > 0
        ? [{ id: "links", label: label, links }]
        : [];

  return (
    <nav aria-label={label} className={mapableRoleNavBarClass}>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          {title ? (
            <p className="mapable-display text-sm font-black text-[#005B7F]">
              {title}
            </p>
          ) : null}
          {trailing}
        </div>
        <div className="flex flex-col gap-4">
          {resolvedGroups.map((group) => (
            <div key={group.id} className="flex flex-col gap-2">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                {group.label}
              </p>
              <ul className="flex flex-1 flex-wrap gap-1">
                {group.links.map((link) => renderLink(link))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
