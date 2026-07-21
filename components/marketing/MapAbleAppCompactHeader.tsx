"use client";

import Link from "next/link";
import React, { type ReactNode } from "react";

import { AccessibilityPanelTrigger } from "@/components/accessibility/AccessibilityPanelTrigger";
import { LogoMark } from "@/components/marketing/mapable-care-shared";

export function MapAbleAppCompactHeader({
  title,
  actions,
  logoHref = "/dashboard",
}: {
  title?: string;
  actions?: ReactNode;
  logoHref?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
        <Link
          href={logoHref}
          className="flex items-center gap-3 rounded-xl p-1 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
        >
          <LogoMark compact />
          <div className="hidden sm:block">
            <span className="mapable-display text-lg font-black tracking-[-0.05em] text-[#005B7F]">
              MapAble
            </span>
            {title ? (
              <span className="mapable-soft block text-xs font-bold text-slate-500">
                {title}
              </span>
            ) : null}
          </div>
          <span className="sr-only">MapAble home</span>
        </Link>
        <div className="flex items-center gap-2">
          <AccessibilityPanelTrigger showLabel={false} className="sm:hidden" />
          <AccessibilityPanelTrigger className="hidden sm:inline-flex" />
          {actions ? (
            <div className="flex items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
