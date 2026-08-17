"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/app/lib/utils";
import { MapAbleLogo } from "@/components/brand/MapAbleLogo";
import type { MapAbleNavGroup } from "@/components/brand/MapAbleSiteHeader";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

type MapAbleNavMenuPanelProps = {
  open: boolean;
  onClose: () => void;
  navGroups: MapAbleNavGroup[];
  logoHref: string;
  actions?: ReactNode;
  isActive: (href: string) => boolean;
};

export function MapAbleNavMenuPanel({
  open,
  onClose,
  navGroups,
  logoHref,
  actions,
  isActive,
}: MapAbleNavMenuPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        aria-label="Close menu"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        id="mapable-nav-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-sm flex-col",
          "border-l border-border/60 bg-card/95 shadow-xl backdrop-blur-md supports-[backdrop-filter]:bg-card/90",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div className="min-w-0">
            <MapAbleLogo href={logoHref} variant="full" ariaLabel="MapAble home" />
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={`inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border border-input bg-background p-2 text-muted-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground ${mapableInteractiveFocusRing}`}
            onClick={onClose}
          >
            <span className="sr-only">Close menu</span>
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="Mobile">
          {navGroups.map((group) => (
            <section key={group.title} className="mb-6 last:mb-0">
              <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </h2>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      className={cn(
                        "block min-h-11 rounded-lg px-3 py-2.5",
                        mapableInteractiveFocusRing,
                        isActive(item.href)
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-accent",
                      )}
                      onClick={onClose}
                      aria-current={isActive(item.href) ? "page" : undefined}
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.description ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        {actions ? (
          <div className="sticky bottom-0 border-t border-border/60 bg-card/95 px-4 py-4 backdrop-blur-md">
            <div className="flex flex-col gap-2">{actions}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
