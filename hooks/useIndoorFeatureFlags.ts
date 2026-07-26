"use client";

import { useQuery } from "@tanstack/react-query";

import {
  type IndoorAccessibilityFeatureFlag,
  getClientIndoorFeatureFlags,
} from "@/lib/access/indoor/feature-flags";

async function fetchIndoorFlags(): Promise<Record<IndoorAccessibilityFeatureFlag, boolean>> {
  try {
    const res = await fetch("/api/indoor/feature-flags");
    if (!res.ok) return getClientIndoorFeatureFlags();
    const data = (await res.json()) as { flags: Record<IndoorAccessibilityFeatureFlag, boolean> };
    return data.flags;
  } catch {
    return getClientIndoorFeatureFlags();
  }
}

export function useIndoorFeatureFlags(): Record<IndoorAccessibilityFeatureFlag, boolean> {
  const { data } = useQuery({
    queryKey: ["indoor-feature-flags"],
    queryFn: fetchIndoorFlags,
    staleTime: 60_000,
    initialData: getClientIndoorFeatureFlags(),
  });
  return data;
}

export function useIndoorFeatureEnabled(flag: IndoorAccessibilityFeatureFlag): boolean {
  const flags = useIndoorFeatureFlags();
  return flags[flag];
}
