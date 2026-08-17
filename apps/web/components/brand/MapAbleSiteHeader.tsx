"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";

import { cn } from "@/app/lib/utils";
import { MapAbleLogo, type MapAbleLogoVariant } from "@/components/brand/MapAbleLogo";
import { MapAbleNavMenuPanel } from "@/components/brand/MapAbleNavMenuPanel";
import {
  mapableHeaderClass,
  mapableNavLinkActiveClass,
  mapableNavLinkClass,
  mapablePageContainerClass,
} from "@/lib/brand/styles";

export type MapAbleNavItem = { href: string; label: string; description?: string };

export type MapAbleNavGroup = {
  title: string;
  items: MapAbleNavItem[];
};

const DEFAULT_NAV: MapAbleNavItem[] = [
  { href: "/core", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/billing", label: "Billing" },
  { href: "/provider-finder", label: "Provider finder" },
];

const MENU_BREAKPOINT_CLASSES = {
  md: { desktop: "hidden md:flex", menu: "md:hidden" },
  lg: { desktop: "hidden xl:flex", menu: "xl:hidden" },
  xl: { desktop: "hidden xl:flex", menu: "xl:hidden" },
} as const;

export function MapAbleSiteHeader({
  logoHref = "/core",
  logoTitle = "MapAble",
  logoSubtitle = "Core",
  navItems = DEFAULT_NAV,
  navGroups,
  menuBreakpoint = "lg",
  externalCta,
  actions,
  logoVariant = "text",
}: {
  logoHref?: string;
  logoTitle?: string;
  logoSubtitle?: string;
  navItems?: MapAbleNavItem[];
  /** Grouped nav for the hamburger panel; when set, uses overlay menu below xl (lg breakpoint). */
  navGroups?: MapAbleNavGroup[];
  menuBreakpoint?: keyof typeof MENU_BREAKPOINT_CLASSES;
  externalCta?: { href: string; label: string };
  /** Replaces default sign-in CTA on desktop (e.g. Log in + Get started). */
  actions?: ReactNode;
  /** Use `full` for the official MapAble wordmark image in the header. */
  logoVariant?: MapAbleLogoVariant;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const useGroupedMenu = navGroups != null && navGroups.length > 0;
  const breakpointClasses = useGroupedMenu
    ? MENU_BREAKPOINT_CLASSES[menuBreakpoint]
    : MENU_BREAKPOINT_CLASSES.md;

  function isActive(href: string) {
    const [path] = href.split("#");
    if (path === "/core") return pathname === "/core";
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  function closeMenu() {
    setOpen(false);
    menuButtonRef.current?.focus();
  }

  function toggleMenu() {
    setOpen((current) => !current);
  }

  const menuPanelActions = actions ? (
    <div className="flex flex-col gap-2 [&_a]:w-full [&_a]:justify-center">{actions}</div>
  ) : null;

  return (
    <header className={mapableHeaderClass}>
      <div className={mapablePageContainerClass}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 py-3 sm:gap-4">
          <MapAbleLogo
            href={logoHref}
            title={logoTitle}
            subtitle={logoSubtitle}
            variant={logoVariant}
            ariaLabel="MapAble home"
          />

          <div className={cn("items-center gap-2", breakpointClasses.desktop)}>
            <nav
              className="mr-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1"
              aria-label="Primary"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(item.href) ? mapableNavLinkActiveClass : mapableNavLinkClass}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {actions ? (
              <div className="flex items-center gap-2">{actions}</div>
            ) : externalCta ? (
              <Link
                href={externalCta.href}
                className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
                target={externalCta.href.startsWith("http") ? "_blank" : undefined}
                rel={externalCta.href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {externalCta.label}
              </Link>
            ) : (
              <Link href="/login" className={mapableNavLinkClass}>
                Sign in
              </Link>
            )}
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            className={cn(
              "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-input bg-background p-2 text-muted-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              breakpointClasses.menu,
            )}
            aria-expanded={open}
            aria-controls={useGroupedMenu ? "mapable-nav-menu" : "mapable-mobile-nav"}
            onClick={toggleMenu}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {useGroupedMenu && open ? (
        <MapAbleNavMenuPanel
          open={open}
          onClose={closeMenu}
          navGroups={navGroups}
          logoHref={logoHref}
          actions={menuPanelActions}
          isActive={isActive}
        />
      ) : null}

      {!useGroupedMenu && open ? (
        <nav
          id="mapable-mobile-nav"
          className={cn("border-t border-border/60 px-4 py-4", breakpointClasses.menu)}
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block min-h-11 rounded-lg px-3 py-2.5 text-sm font-medium",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {actions ? (
              <li className="flex flex-col gap-2 px-3 pt-2">{actions}</li>
            ) : (
              <li>
                <Link
                  href="/login"
                  className="block min-h-11 rounded-lg px-3 py-2.5 text-sm font-medium text-primary"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
              </li>
            )}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
