"use client";

import type { ReactNode } from "react";

import { MapAbleAppShell } from "@/components/marketing/MapAbleAppShell";

export function MapAbleRoleAppShell({
  children,
  headerTitle,
  secondaryNav,
  headerActions,
  logoHref,
}: {
  children: ReactNode;
  headerTitle: string;
  secondaryNav: ReactNode;
  headerActions?: ReactNode;
  logoHref?: string;
}) {
  return (
    <MapAbleAppShell
      variant="app"
      headerTitle={headerTitle}
      headerActions={headerActions}
      logoHref={logoHref}
      secondaryNav={secondaryNav}
    >
      {children}
    </MapAbleAppShell>
  );
}
