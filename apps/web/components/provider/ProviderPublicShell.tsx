"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { MapAbleAppShell } from "@/components/marketing/MapAbleAppShell";

export function ProviderPublicShell({ children }: { children: ReactNode }) {
  return (
    <MapAbleAppShell
      variant="app"
      headerTitle="Provider directory"
      headerActions={
        <Link
          href="/provider-finder"
          className="rounded-xl bg-[#005B7F] px-4 py-2 text-sm font-black text-white transition hover:bg-[#004766] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
        >
          Back to finder
        </Link>
      }
    >
      {children}
    </MapAbleAppShell>
  );
}
