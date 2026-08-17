"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { cn } from "@/app/lib/utils";
import {
  mapableNavLinkActiveClass,
  mapableNavLinkClass,
  mapablePageContainerClass,
  mapableRoleNavBarClass,
} from "@/lib/brand/styles";

export type PortalNavLink = {
  href: string;
  label: string;
  /** exact = hub route only; prefix (default) = href and children */
  match?: "exact" | "prefix";
};

export function PortalNav({
  title,
  links,
  backHref = "/dashboard",
  backLabel = "Dashboard",
}: {
  title: string;
  links: PortalNavLink[];
  backHref?: string;
  backLabel?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  function isActive(link: PortalNavLink) {
    if (link.match === "exact") {
      return pathname === link.href;
    }
    return pathname === link.href || pathname.startsWith(`${link.href}/`);
  }

  function closeMenu() {
    setOpen(false);
    menuButtonRef.current?.focus();
  }

  const allLinks = [
    ...links,
    { href: backHref, label: backLabel, match: "prefix" as const },
  ];

  return (
    <nav aria-label={title} className={mapableRoleNavBarClass}>
      <div className={mapablePageContainerClass}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 py-3 sm:gap-4">
          <p className="mapable-display hidden text-sm font-black text-[#005B7F] sm:block">{title}</p>

          <nav
            className="hidden flex-1 items-center gap-1 xl:flex"
            aria-label={title}
          >
            <ul className="flex flex-wrap items-center justify-end gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive(link) ? "page" : undefined}
                    className={
                      isActive(link)
                        ? mapableNavLinkActiveClass
                        : mapableNavLinkClass
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={backHref}
                  className={cn(mapableNavLinkClass, "font-semibold text-primary")}
                >
                  {backLabel}
                </Link>
              </li>
            </ul>
          </nav>

          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-input bg-background p-2 text-muted-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 xl:hidden"
            aria-expanded={open}
            aria-controls="portal-mobile-nav"
            onClick={() => setOpen((current) => !current)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            {open ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="portal-mobile-nav"
          className="border-t border-border/60 px-4 py-4 xl:hidden"
          aria-label={title}
        >
          <ul className="space-y-1">
            {allLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "block min-h-11 rounded-lg px-3 py-2.5 text-sm font-medium",
                    isActive(link)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent",
                    link.href === backHref && "font-semibold text-primary"
                  )}
                  onClick={closeMenu}
                  aria-current={isActive(link) ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </nav>
  );
}
