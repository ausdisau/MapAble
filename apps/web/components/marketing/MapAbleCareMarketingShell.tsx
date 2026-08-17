"use client";

import type { ReactNode } from "react";

import { MapAbleAppShell } from "@/components/marketing/MapAbleAppShell";

export function MapAbleCareMarketingShell({ children }: { children: ReactNode }) {
  return <MapAbleAppShell variant="marketing">{children}</MapAbleAppShell>;
}
